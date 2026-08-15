import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingState from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/ToastProvider";
import DepartmentList from "./components/DepartmentList";
import DepartmentForm from "./components/DepartmentForm";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "./api";
import { getMembers } from "../members/api";

export default function DepartmentsPage() {
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [formDepartment, setFormDepartment] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [departmentPendingDelete, setDepartmentPendingDelete] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([getDepartments(), getMembers()])
      .then(([departmentsData, membersData]) => {
        if (isMounted) {
          setDepartments(departmentsData);
          setMembers(membersData);
        }
      })
      .catch(() => {
        if (isMounted) toast.error("Couldn't load departments. Try refreshing.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentsWithCounts = useMemo(() => {
    return departments.map((dept) => ({
      ...dept,
      memberCount: members.filter((m) => m.department === dept.name).length,
    }));
  }, [departments, members]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return departmentsWithCounts;
    return departmentsWithCounts.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.leader.toLowerCase().includes(query)
    );
  }, [departmentsWithCounts, search]);

  function handleAddNew() {
    setFormDepartment(null);
    setIsFormOpen(true);
  }

  function handleEdit(department) {
    setFormDepartment(department);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  async function handleSaveDepartment(formData) {
    try {
      if (formDepartment) {
        await updateDepartment(formDepartment.id, formData);
        setDepartments((prev) =>
          prev.map((d) => (d.id === formDepartment.id ? { ...d, ...formData } : d))
        );
        toast.success(`${formData.name} was updated`);
      } else {
        const created = await createDepartment(formData);
        setDepartments((prev) => [...prev, created]);
        toast.success(`${formData.name} was added`);
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Something went wrong saving this department.");
    }
  }

  function handleDelete(department) {
    setDepartmentPendingDelete(department);
  }

  function handleCancelDelete() {
    setDepartmentPendingDelete(null);
  }

  async function handleConfirmDelete() {
    try {
      await deleteDepartment(departmentPendingDelete.id);
      setDepartments((prev) =>
        prev.filter((d) => d.id !== departmentPendingDelete.id)
      );
      toast.success(`${departmentPendingDelete.name} was deleted`);
    } catch {
      toast.error("Something went wrong deleting this department.");
    } finally {
      setDepartmentPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage church departments and their leaders.
          </p>
        </div>
        <Button variant="primary" onClick={handleAddNew} className="sm:w-auto">
          + New Department
        </Button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading departments..." />
      ) : (
        <>
          <Input
            icon={Search}
            placeholder="Search by department or leader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <DepartmentList
            departments={filteredDepartments}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      <DepartmentForm
        department={formDepartment}
        members={members}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveDepartment}
      />

      <ConfirmDialog
        isOpen={Boolean(departmentPendingDelete)}
        title="Delete this department?"
        description={
          departmentPendingDelete
            ? `This will permanently remove ${departmentPendingDelete.name}${
                departmentPendingDelete.memberCount > 0
                  ? ` — ${departmentPendingDelete.memberCount} member${
                      departmentPendingDelete.memberCount === 1 ? "" : "s"
                    } currently assigned to it will need to be reassigned`
                  : ""
              }. This action can't be undone.`
            : ""
        }
        confirmLabel="Delete Department"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}