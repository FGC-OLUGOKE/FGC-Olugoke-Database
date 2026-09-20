import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Search } from "lucide-react";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingState from "../../components/ui/LoadingState";

import { useToast } from "../../components/ui/ToastProvider";

import DepartmentList from "./components/DepartmentList";
import DepartmentForm from "./components/DepartmentForm";
import DepartmentDetailsDrawer from "./components/DepartmentDetailsDrawer";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./api";

import { getMembers, promoteMemberToAdmin } from "../members/api";
import FloatingActionButton from "../../components/ui/FloatingActionButton";
import { useAuth } from "../auth/AuthContext";
import {
  canManageDepartments,
  isDepartmentAdmin,
  isPastorate,
  isSuperAdmin,
} from "../../lib/permissions";
import { getScopedDepartments } from "../../lib/permissions";
import { getCached } from "../../lib/apiClient";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState(() => getCached("/departments/") || []);
  const [members, setMembers] = useState(() => getCached("/members/") || []);

  const [isLoading, setIsLoading] = useState(() => !getCached("/departments/"));

  const [search, setSearch] = useState("");

  const [formDepartment, setFormDepartment] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [departmentPendingDelete, setDepartmentPendingDelete] =
    useState(null);

  async function loadDepartmentData() {
    const [departmentsData, membersData] = await Promise.all([
      getDepartments(),
      getMembers(),
    ]);

    setDepartments(
      Array.isArray(departmentsData) ? departmentsData : [],
    );

    setMembers(Array.isArray(membersData) ? membersData : []);
  }

  useEffect(() => {
    let isMounted = true;

    setIsLoading(!getCached("/departments/"));

    Promise.all([getDepartments(), getMembers()])
      .then(([departmentsData, membersData]) => {
        if (!isMounted) return;

        const nextDepartments = Array.isArray(departmentsData) ? departmentsData : [];
        setDepartments(nextDepartments);
        setMembers(Array.isArray(membersData) ? membersData : []);

        if (isDepartmentAdmin(user)) {
          const assignedDepartment = nextDepartments.find(
            (department) => department.name === user.scope,
          );
          if (assignedDepartment) {
            navigate(`/my-department/${assignedDepartment.id}`, { replace: true });
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          toast.error("Couldn't load departments. Try refreshing.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user]);

  async function handleAppointMemberAsDepartmentAdmin(departmentId, memberId) {
    try {
      const updated = await promoteMemberToAdmin({
        member_id: memberId,
        role: "department_admin",
        department_id: departmentId,
      });
      setDepartments((previous) =>
        previous.map((item) =>
          item.id === departmentId
            ? { ...item, departmentAdmin: updated }
            : item,
        ),
      );
      setSelectedDepartment((previous) =>
        previous?.id === departmentId
          ? { ...previous, departmentAdmin: updated }
          : previous,
      );
      await loadDepartmentData();
      toast.success("Department Admin appointed.");
    } catch (error) {
      toast.error(error?.message || "Couldn't appoint the Department Admin.");
      throw error;
    }
  }

  const departmentsWithCounts = useMemo(() => {
    return getScopedDepartments(user, departments).map((dept) => ({
      ...dept,

      memberCount: members.filter((member) =>
        Array.isArray(member.departments)
          ? member.departments.includes(dept.name)
          : false,
      ).length,
    }));
  }, [departments, members, user]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return departmentsWithCounts;
    }

    return departmentsWithCounts.filter(
      (department) =>
        department.name.toLowerCase().includes(query) ||
        (department.leader || "").toLowerCase().includes(query),
    );
  }, [departmentsWithCounts, search]);

  function handleAddNew() {
    if (!canManageDepartments(user)) return;
    setFormDepartment(null);
    setIsFormOpen(true);
  }

  function handleSelectDepartment(department) {
    setSelectedDepartment(department);
    setIsDetailsOpen(true);
  }

  function handleCloseDetails() {
    setIsDetailsOpen(false);
    setSelectedDepartment(null);
  }

  function handleEditDepartment(department) {
    if (!canManageDepartments(user)) return;
    setFormDepartment(department);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setFormDepartment(null);
  }

  async function handleSaveDepartment(formData) {
    try {
      if (formDepartment) {
        const updated = await updateDepartment(
          formDepartment.id,
          formData,
        );

        setDepartments((previous) =>
          previous.map((department) =>
            department.id === formDepartment.id
              ? { ...department, ...updated, ...formData }
              : department,
          ),
        );

        setSelectedDepartment((previous) =>
          previous?.id === formDepartment.id
            ? { ...previous, ...updated, ...formData }
            : previous,
        );

        toast.success(`${formData.name} was updated`);
      } else {
        const created = await createDepartment(formData);

        setDepartments((previous) => [...previous, created]);

        toast.success(`${formData.name} was added`);
      }

      setIsFormOpen(false);
      setFormDepartment(null);
    } catch (error) {
      console.error(error);

      toast.error(
        "Something went wrong saving this department.",
      );
    }
  }

  async function handleMembersChanged() {
    try {
      await loadDepartmentData();

      setSelectedDepartment((previous) => {
        if (!previous) return previous;

        const refreshed = departments.find(
          (department) => department.id === previous.id,
        );

        return refreshed
          ? { ...previous, ...refreshed }
          : previous;
      });
    } catch (error) {
      console.error(error);

      toast.error(
        "Members were updated, but the department data could not be refreshed.",
      );
    }
  }

  function handleDeleteDepartment(department) {
    setDepartmentPendingDelete(
      department || selectedDepartment,
    );
  }

  async function handleConfirmDelete() {
    if (!departmentPendingDelete) return;

    try {
      await deleteDepartment(departmentPendingDelete.id);

      setDepartments((previous) =>
        previous.filter(
          (department) =>
            department.id !== departmentPendingDelete.id,
        ),
      );

      if (
        selectedDepartment?.id ===
        departmentPendingDelete.id
      ) {
        setIsDetailsOpen(false);
        setSelectedDepartment(null);
      }

      toast.success(
        `${departmentPendingDelete.name} was deleted`,
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Something went wrong deleting this department.",
      );
    } finally {
      setDepartmentPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Departments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage church departments, members, and leaders.
          </p>
        </div>

        {canManageDepartments(user) && <div className="hidden md:inline-block">
              <Button
                variant="primary"
                onClick={handleAddNew}
                className="hidden md:inline-flex sm:w-auto"
              >
                + New Department
              </Button>
        </div>}
      </div>

      {canManageDepartments(user) && (
        <FloatingActionButton
          label="New Department"
          storageKey="departments-create"
          onClick={handleAddNew}
        />
      )}

      {isLoading ? (
        <LoadingState label="Loading departments..." />
      ) : (
        <>
          {/* Search */}
          <Input
            icon={Search}
            placeholder="Search by department or leader..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {/* Department cards */}
          <DepartmentList
            departments={filteredDepartments}
            onSelect={handleSelectDepartment}
          />
        </>
      )}

      {/* Create/Edit Department */}
      <DepartmentForm
        department={formDepartment}
        members={members}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveDepartment}
      />

      {/* Department Management */}
      <DepartmentDetailsDrawer
        department={selectedDepartment}
        members={members}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onMembersChanged={handleMembersChanged}
        onEditDetails={handleEditDepartment}
        canManageAdmin={isPastorate(user) || isSuperAdmin(user)}
        canEditDepartment={canManageDepartments(user)}
        onAppointMember={handleAppointMemberAsDepartmentAdmin}
        onViewDepartment={(department) => navigate(`/my-department/${department.id}`)}
        onDelete={canManageDepartments(user) ? () => handleDeleteDepartment(selectedDepartment) : undefined}
      />
      
      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(departmentPendingDelete)}
        title="Delete this department?"
        description={
          departmentPendingDelete
            ? `This will permanently remove ${
                departmentPendingDelete.name
              }. Members currently assigned to it will remain in the database but will need to be reassigned.`
            : ""
        }
        confirmLabel="Delete Department"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDepartmentPendingDelete(null)
        }
      />
    </div>
  );
}