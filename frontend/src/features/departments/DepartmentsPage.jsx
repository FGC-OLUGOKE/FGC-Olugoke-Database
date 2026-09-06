import { useEffect, useMemo, useState } from "react";

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

import { getMembers } from "../members/api";
import FloatingActionButton from "../../components/ui/FloatingActionButton";

export default function DepartmentsPage() {
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

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

    setIsLoading(true);

    Promise.all([getDepartments(), getMembers()])
      .then(([departmentsData, membersData]) => {
        if (!isMounted) return;

        setDepartments(
          Array.isArray(departmentsData) ? departmentsData : [],
        );

        setMembers(Array.isArray(membersData) ? membersData : []);
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
  }, []);

  const departmentsWithCounts = useMemo(() => {
    return departments.map((dept) => ({
      ...dept,

      memberCount: members.filter((member) =>
        Array.isArray(member.departments)
          ? member.departments.includes(dept.name)
          : false,
      ).length,
    }));
  }, [departments, members]);

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

  async function handleSaveLeader(departmentData) {
    const updated = await updateDepartment(
      departmentData.id,
      {
        leader: departmentData.leader,
      },
    );

    const nextDepartment = {
      ...departmentData,
      ...updated,
      leader: departmentData.leader,
    };

    setDepartments((previous) =>
      previous.map((department) =>
        department.id === departmentData.id
          ? { ...department, ...nextDepartment }
          : department,
      ),
    );

    setSelectedDepartment((previous) =>
      previous?.id === departmentData.id
        ? { ...previous, ...nextDepartment }
        : previous,
    );

    return updated;
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

        <Button
          variant="primary"
          onClick={handleAddNew}
          className="hidden md:inline-flex sm:w-auto"
        >
          + New Department
        </Button>
      </div>

      <FloatingActionButton
        label="New Department"
        storageKey="departments-create"
        onClick={handleAddNew}
      />

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
        onEdit={handleSaveLeader}
        onDelete={() =>
          handleDeleteDepartment(selectedDepartment)
        }
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