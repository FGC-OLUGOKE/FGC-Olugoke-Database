import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  ClipboardList,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";

import Drawer from "../../../components/ui/Drawer";
import SectionCard from "../../../components/ui/SectionCard";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/ToastProvider";
import { isCategoryAdmin } from "../../../lib/permissions";

const CATEGORY_FIELDS = [
  { key: "adults", label: "Adult" },
  { key: "youth", label: "Youth" },
  { key: "teenagers", label: "Teenager" },
  { key: "children", label: "Children" },
];

const CATEGORY_FIELD_BY_NAME = {
  Adult: "adults",
  Youth: "youth",
  Teenager: "teenagers",
  Children: "children",
};

/*
 * TEMPORARY FRONTEND DATA
 *
 * These will eventually come from the backend.
 *
 * A class is independent of the member's broad category.
 */
const DEFAULT_SUNDAY_SCHOOL_CLASSES = [
  {
    id: "cdc-1",
    name: "CDC 1",
    defaultRecorderId: "children-admin",
  },
  {
    id: "cdc-2",
    name: "CDC 2",
    defaultRecorderId: "children-admin",
  },
  {
    id: "cdc-3",
    name: "CDC 3",
    defaultRecorderId: "youth-admin",
  },
  {
    id: "next-gen",
    name: "Next Gen",
    defaultRecorderId: "youth-admin",
  },
  {
    id: "youth-class",
    name: "Youth Class",
    defaultRecorderId: "youth-admin",
  },
  {
    id: "adult-class",
    name: "Adult Class",
    defaultRecorderId: "adult-admin",
  },
  {
    id: "yoruba-class",
    name: "Yoruba Class",
    defaultRecorderId: "adult-admin",
  },
];

/*
 * TEMPORARY FRONTEND DATA
 *
 * Eventually returned by the backend based on permissions.
 */
const SUNDAY_SCHOOL_RECORDERS = [
  {
    id: "children-admin",
    name: "Children Admin",
    category: "Children",
  },
  {
    id: "teenagers-admin",
    name: "Teenager Admin",
    category: "Teenager",
  },
  {
    id: "youth-admin",
    name: "Youth Admin",
    category: "Youth",
  },
  {
    id: "adult-admin",
    name: "Adult Admin",
    category: "Adult",
  },
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyForm() {
  return {
    date: todayValue(),
    eventName: "",
    adults: "",
    youth: "",
    teenagers: "",
    children: "",
  };
}

function createEmptySundaySchoolForm() {
  return {
    date: todayValue(),

    /*
     * Each item represents one class taking attendance
     * during this session.
     */
    classes: [],
  };
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export default function AttendanceForm({
  isOpen,
  onClose,
  onSave,
  onCreateSundaySchoolSession,
  user,
  isSaving = false,
}) {
  const toast = useToast();

  const isScopedRecorder = isCategoryAdmin(user);

  const scopedCategoryKey = useMemo(() => {
    return CATEGORY_FIELD_BY_NAME[user?.scope] || null;
  }, [user]);

  const visibleCategoryFields = useMemo(() => {
    if (!isScopedRecorder) {
      return CATEGORY_FIELDS;
    }

    return CATEGORY_FIELDS.filter(
      (field) => field.key === scopedCategoryKey,
    );
  }, [isScopedRecorder, scopedCategoryKey]);

  const [form, setForm] = useState(createEmptyForm);

  const [sundaySchoolForm, setSundaySchoolForm] = useState(
    createEmptySundaySchoolForm,
  );

  const [sundaySchoolClasses, setSundaySchoolClasses] = useState(
    DEFAULT_SUNDAY_SCHOOL_CLASSES,
  );

  const [errors, setErrors] = useState({});

  const [activeTab, setActiveTab] = useState("attendance");

  const [showNewClass, setShowNewClass] = useState(false);

  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(createEmptyForm());
    setSundaySchoolForm(createEmptySundaySchoolForm());
    setErrors({});
    setActiveTab("attendance");
    setShowNewClass(false);
    setNewClassName("");
  }, [isOpen]);

  /*
   * ------------------------------------------
   * CHURCH SERVICE ATTENDANCE
   * ------------------------------------------
   */

  function updateAttendance(field, value) {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  }

  const calculatedTotal = useMemo(() => {
    return visibleCategoryFields.reduce(
      (sum, field) => sum + toNumber(form[field.key]),
      0,
    );
  }, [form, visibleCategoryFields]);

  function validateChurchAttendance() {
    const newErrors = {};

    if (!form.eventName?.trim()) {
      newErrors.eventName = "Event name is required.";
    }

    if (!form.date) {
      newErrors.date = "Attendance date is required.";
    }

    for (const field of visibleCategoryFields) {
      const value = form[field.key];

      if (value === "" || value === null || value === undefined) {
        newErrors[field.key] = `${field.label} attendance is required.`;
      } else if (Number(value) < 0) {
        newErrors[field.key] =
          `${field.label} attendance cannot be negative.`;
      }
    }

    if (calculatedTotal <= 0) {
      for (const field of visibleCategoryFields) {
        if (!form[field.key]) {
          newErrors[field.key] = `${field.label} field is required.`;
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return "Please correct the highlighted fields.";
    }

    return null;
  }

  function buildChurchAttendancePayload() {
    return {
      date: form.date,
      eventName: form.eventName.trim(),

      adults:
        !isScopedRecorder || scopedCategoryKey === "adults"
          ? toNumber(form.adults)
          : 0,

      youth:
        !isScopedRecorder || scopedCategoryKey === "youth"
          ? toNumber(form.youth)
          : 0,

      teenagers:
        !isScopedRecorder || scopedCategoryKey === "teenagers"
          ? toNumber(form.teenagers)
          : 0,

      children:
        !isScopedRecorder || scopedCategoryKey === "children"
          ? toNumber(form.children)
          : 0,
    };
  }

  /*
   * ------------------------------------------
   * SUNDAY SCHOOL SESSION
   * ------------------------------------------
   */

  function addSundaySchoolClass(classId) {
    const classData = sundaySchoolClasses.find(
      (item) => item.id === classId,
    );

    if (!classData) {
      return;
    }

    if (
      sundaySchoolForm.classes.some(
        (item) => item.classId === classId,
      )
    ) {
      toast.error("This class has already been added.");
      return;
    }

    setSundaySchoolForm((previous) => ({
      ...previous,

      classes: [
        ...previous.classes,
        {
          classId: classData.id,
          className: classData.name,

          /*
           * This is only the recorder responsible for
           * recording this class in this particular session.
           */
          recorderId: classData.defaultRecorderId || "",
        },
      ],
    }));

    setErrors((previous) => ({
      ...previous,
      classes: "",
    }));
  }

  function removeSundaySchoolClass(classId) {
    setSundaySchoolForm((previous) => ({
      ...previous,

      classes: previous.classes.filter(
        (item) => item.classId !== classId,
      ),
    }));
  }

  function updateClassRecorder(classId, recorderId) {
    setSundaySchoolForm((previous) => ({
      ...previous,

      classes: previous.classes.map((item) =>
        item.classId === classId
          ? {
              ...item,
              recorderId,
            }
          : item,
      ),
    }));

    setErrors((previous) => ({
      ...previous,
      [`recorder-${classId}`]: "",
    }));
  }

  function handleCreateNewClass() {
    const trimmedName = newClassName.trim();

    if (!trimmedName) {
      setErrors((previous) => ({
        ...previous,
        newClass: "Class name is required.",
      }));

      return;
    }

    const alreadyExists = sundaySchoolClasses.some(
      (item) =>
        item.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (alreadyExists) {
      setErrors((previous) => ({
        ...previous,
        newClass: "A class with this name already exists.",
      }));

      return;
    }

    const newClass = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      defaultRecorderId: "",
    };

    setSundaySchoolClasses((previous) => [
      ...previous,
      newClass,
    ]);

    /*
     * Automatically add the new class to the current session.
     */
    setSundaySchoolForm((previous) => ({
      ...previous,

      classes: [
        ...previous.classes,
        {
          classId: newClass.id,
          className: newClass.name,
          recorderId: "",
        },
      ],
    }));

    setNewClassName("");
    setShowNewClass(false);

    setErrors((previous) => ({
      ...previous,
      newClass: "",
      classes: "",
    }));
  }

  function validateSundaySchoolSession() {
    const newErrors = {};

    if (!sundaySchoolForm.date) {
      newErrors.sundaySchoolDate = "Session date is required.";
    }

    if (sundaySchoolForm.classes.length === 0) {
      newErrors.classes = "Add at least one class to the session.";
    }

    sundaySchoolForm.classes.forEach((classItem) => {
      if (!classItem.recorderId) {
        newErrors[`recorder-${classItem.classId}`] =
          "Select a recorder.";
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return "Please complete the Sunday School session.";
    }

    return null;
  }

  function buildSundaySchoolSessionPayload() {
    return {
      date: sundaySchoolForm.date,

      /*
       * The backend can create the session and its
       * class assignments from this array.
       */
      classes: sundaySchoolForm.classes.map((classItem) => ({
        classId: classItem.classId,
        recorderId: classItem.recorderId,
      })),
    };
  }

  /*
   * ------------------------------------------
   * SUBMIT
   * ------------------------------------------
   */

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;

    if (activeTab === "attendance") {
      const validationError = validateChurchAttendance();

      if (validationError) {
        toast.error(validationError);
        return;
      }

      try {
        await onSave?.(buildChurchAttendancePayload());

        setForm(createEmptyForm());
        setErrors({});
      } catch (err) {
        console.error(err);
      }

      return;
    }

    const validationError = validateSundaySchoolSession();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await onCreateSundaySchoolSession?.(
        buildSundaySchoolSessionPayload(),
      );

      setSundaySchoolForm(createEmptySundaySchoolForm());
      setErrors({});
    } catch (err) {
      console.error(err);
    }
  }

  const availableClasses = sundaySchoolClasses.filter(
    (classItem) =>
      !sundaySchoolForm.classes.some(
        (selectedClass) =>
          selectedClass.classId === classItem.id,
      ),
  );

  const recorderOptions = SUNDAY_SCHOOL_RECORDERS.map(
    (recorder) => ({
      value: recorder.id,
      label: recorder.name,
    }),
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Attendance Session"
      widthClass="md:max-w-2xl"
      desktopModal
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex h-full flex-col"
      >
        {/* TABS */}

        <div className="border-b border-gray-200 px-5 md:px-8">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className={`relative flex items-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === "attendance"
                  ? "text-[#4a2969]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="h-4 w-4" strokeWidth={2} />

              Church Service

              {activeTab === "attendance" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#4a2969]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sunday-school")}
              className={`relative flex items-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === "sunday-school"
                  ? "text-[#4a2969]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ClipboardList
                className="h-4 w-4"
                strokeWidth={2}
              />

              Sunday School

              {activeTab === "sunday-school" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#4a2969]" />
              )}
            </button>
          </div>
        </div>

        {/* CONTENT */}

        <div className="flex-1 overflow-y-auto">
          {/* CHURCH SERVICE */}

          {activeTab === "attendance" && (
            <div className="space-y-6 px-5 py-6 md:px-8 md:py-7">
              <SectionCard title="Attendance Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Event Name"
                    type="text"
                    required
                    value={form.eventName}
                    error={errors.eventName}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        eventName: event.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Attendance Date"
                    type="date"
                    required
                    value={form.date}
                    error={errors.date}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        date: event.target.value,
                      }))
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Appearances by Category">
                <div className="mb-4 flex items-center gap-2">
                  <Users
                    className="h-4 w-4 text-[#4a2969]"
                    strokeWidth={2}
                  />

                  <p className="text-sm text-gray-500">
                    {isScopedRecorder
                      ? `Record the total ${user?.scope?.toLowerCase()} appearances for this service.`
                      : "Enter the total church service appearances for each category."}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleCategoryFields.map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={form[field.key]}
                      error={errors[field.key]}
                      onChange={(event) =>
                        updateAttendance(
                          field.key,
                          event.target.value,
                        )
                      }
                    />
                  ))}
                </div>
              </SectionCard>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Total Appearances
                </span>

                <span className="text-base font-semibold text-gray-900">
                  {calculatedTotal}
                </span>
              </div>
            </div>
          )}

          {/* SUNDAY SCHOOL */}

          {activeTab === "sunday-school" && (
            <div className="space-y-6 px-5 py-6 md:px-8 md:py-7">
              <SectionCard title="Session Details">
                <div className="max-w-sm">
                  <Input
                    label="Attendance Date"
                    type="date"
                    required
                    value={sundaySchoolForm.date}
                    error={errors.sundaySchoolDate}
                    onChange={(event) =>
                      setSundaySchoolForm((previous) => ({
                        ...previous,
                        date: event.target.value,
                      }))
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Classes for this Session">
                <div className="mb-5 flex items-start gap-3 rounded-lg bg-[#4a2969]/5 px-4 py-3">
                  <ClipboardList
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#4a2969]"
                    strokeWidth={2}
                  />

                  <p className="text-sm leading-5 text-gray-600">
                    Select the Sunday School classes that will
                    take attendance for this session and assign
                    a recorder to each class.
                  </p>
                </div>

                {errors.classes && (
                  <div className="mb-4 rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 px-4 py-3 text-xs text-[#9e263b]">
                    {errors.classes}
                  </div>
                )}

                <div className="mb-5">
                  <Select
                    label="Add Class"
                    placeholder="Select a class"
                    options={availableClasses.map(
                      (classItem) => ({
                        value: classItem.id,
                        label: classItem.name,
                      }),
                    )}
                    value=""
                    onChange={(event) => {
                      if (event.target.value) {
                        addSundaySchoolClass(
                          event.target.value,
                        );

                        event.target.value = "";
                      }
                    }}
                  />
                </div>

                {sundaySchoolForm.classes.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      <span>Class</span>
                      <span>Recorder</span>
                      <span className="w-8" />
                    </div>

                    {sundaySchoolForm.classes.map((classItem) => (
                      <div
                        key={classItem.classId}
                        className="grid grid-cols-[1fr_1fr_auto] items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="flex min-h-[40px] items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#4a2969]/10">
                            <Users
                              className="h-4 w-4 text-[#4a2969]"
                              strokeWidth={2}
                            />
                          </div>

                          <span className="text-sm font-medium text-gray-800">
                            {classItem.className}
                          </span>
                        </div>

                        <Select
                          aria-label={`Recorder for ${classItem.className}`}
                          placeholder="Select recorder"
                          options={recorderOptions}
                          value={classItem.recorderId}
                          error={
                            errors[
                              `recorder-${classItem.classId}`
                            ]
                          }
                          onChange={(event) =>
                            updateClassRecorder(
                              classItem.classId,
                              event.target.value,
                            )
                          }
                        />

                        <button
                          type="button"
                          title={`Remove ${classItem.className}`}
                          onClick={() =>
                            removeSundaySchoolClass(
                              classItem.classId,
                            )
                          }
                          className="mt-1 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-[#9e263b]/5 hover:text-[#9e263b]"
                        >
                          <Trash2
                            className="h-4 w-4"
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {sundaySchoolForm.classes.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <Users
                        className="h-4 w-4 text-gray-400"
                        strokeWidth={2}
                      />
                    </div>

                    <p className="text-sm font-medium text-gray-700">
                      No classes added
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Select the classes that will take attendance
                      for this session.
                    </p>
                  </div>
                )}

                {/* CREATE NEW CLASS */}

                <div className="mt-5 border-t border-gray-100 pt-4">
                  {!showNewClass ? (
                    <button
                      type="button"
                      onClick={() => setShowNewClass(true)}
                      className="flex items-center gap-2 text-sm font-medium text-[#4a2969] transition hover:text-[#3b2057]"
                    >
                      <Plus
                        className="h-4 w-4"
                        strokeWidth={2}
                      />

                      Create New Class
                    </button>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-800">
                          Create a new Sunday School class
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          The class will remain available for
                          future attendance sessions.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <Input
                            label="Class Name"
                            placeholder="e.g. Men's Bible Study"
                            value={newClassName}
                            error={errors.newClass}
                            onChange={(event) => {
                              setNewClassName(
                                event.target.value,
                              );

                              setErrors((previous) => ({
                                ...previous,
                                newClass: "",
                              }));
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setShowNewClass(false);
                              setNewClassName("");

                              setErrors((previous) => ({
                                ...previous,
                                newClass: "",
                              }));
                            }}
                          >
                            Cancel
                          </Button>

                          <Button
                            type="button"
                            onClick={handleCreateNewClass}
                          >
                            <Plus
                              className="h-4 w-4"
                              strokeWidth={2}
                            />

                            Add Class
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              {sundaySchoolForm.classes.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className="h-4 w-4 text-gray-400"
                      strokeWidth={2}
                    />

                    <span className="text-sm text-gray-500">
                      Classes in this session
                    </span>
                  </div>

                  <span className="text-sm font-semibold text-gray-900">
                    {sundaySchoolForm.classes.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.06)] md:px-8">
          <div>
            {activeTab === "attendance" ? (
              <button
                type="button"
                onClick={() => setActiveTab("sunday-school")}
                className="text-sm font-medium text-[#4a2969] hover:underline"
              >
                Sunday School →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("attendance")}
                className="text-sm font-medium text-[#4a2969] hover:underline"
              >
                ← Church Service
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={isSaving}
              loadingLabel="Saving..."
            >
              <Save
                className="h-4 w-4"
                strokeWidth={2}
              />

              {isSaving
                ? "Saving..."
                : activeTab === "attendance"
                  ? "Save Attendance"
                  : "Create Session"}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
