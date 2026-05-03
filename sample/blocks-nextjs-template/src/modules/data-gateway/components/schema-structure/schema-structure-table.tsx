"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus } from "lucide-react";
import { useGetSchemas, useSaveSchemaFields } from "../../hooks/useDataGateway";
import type { Schema, SchemaField } from "../../types/data-gateway.types";
import {
  DEFAULT_NON_EDITABLE_FIELD_NAMES,
  PRIMITIVE_FIELD_TYPES,
} from "../../types/data-gateway.types";
import { findChildSchemaByType, isChildType } from "../../utils/schema.utils";
import { SchemaDesktopRow } from "./schema-desktop-row";
import { SchemaStructureHeader } from "./schema-structure-header";
import { ChildSchemaExpandableContent } from "./child-schema-expandable-content";
import { SchemaStructureTableSkeleton } from "./schema-structure-table-skeleton";
import { useReadonlyExpanded } from "../../hooks/use-readonly-expanded";

const DEFAULT_PROPERTY: SchemaField = {
  name: "",
  type: "String",
  isArray: false,
};

interface EmptySchemaPropertyStateProps {
  isEmbedded: boolean;
  isReadonlyExpanded: boolean;
  schema: Schema;
  schemaType: number;
  onOpenStandaloneSchemaEditor?: (schemaId: string) => void;
  handleAddField: () => void;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
}

const EmptySchemaPropertyState = ({
  isEmbedded,
  isReadonlyExpanded,
  schema,
  schemaType,
  onOpenStandaloneSchemaEditor,
  handleAddField,
  isEditMode,
  setIsEditMode,
}: EmptySchemaPropertyStateProps) => {
  if (isEmbedded) {
    return (
      <div
        className={cn(
          "flex w-full flex-1 flex-col items-center justify-center px-4 py-10",
          isReadonlyExpanded && "py-8",
        )}
      >
        <div className="flex max-w-md flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h3 className="wrap-break-word text-base font-semibold leading-snug text-foreground sm:text-lg">
              <span className="font-medium">{schema.schemaName}</span> doesn`t
              have any {schemaType === 1 ? "custom property" : "property"} yet.
            </h3>
            <p className="text-sm text-muted-foreground">
              Nested child schemas cannot be edited here. Open this schema from
              the Schemas list (Child) to add or change properties.
            </p>
          </div>
          {onOpenStandaloneSchemaEditor && schema.id ? (
            <Button
              type="button"
              className="gap-2"
              onClick={() => onOpenStandaloneSchemaEditor(schema.id)}
            >
              Open child schema
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center py-12",
        schemaType === 1 ? "h-[calc(100vh-542px)]" : "h-[calc(100vh-450px)]",
        isReadonlyExpanded && "h-[calc(100vh-495px)]",
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <h3 className="wrap-break-word px-2 text-center text-base font-semibold leading-snug text-foreground sm:text-lg">
            This schema doesn`t have any{" "}
            {schemaType === 1 ? "custom property" : "property"} yet. Click Add
            Property to set one up.
          </h3>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            console.log('🖱️ Empty state "Add Property" button clicked');
            handleAddField();
            if (!isEditMode) setIsEditMode(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>
    </div>
  );
};

interface SchemaStructureTableProps {
  schema: Schema;
  isLoading?: boolean;
  compactView?: boolean;
  onOpenStandaloneSchemaEditor?: (schemaId: string) => void;
}

export default function SchemaStructureTable({
  schema,
  isLoading,
  compactView,
  onOpenStandaloneSchemaEditor,
}: SchemaStructureTableProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [openTypePopoverIndex, setOpenTypePopoverIndex] = useState<
    number | null
  >(null);
  const [searchText, setSearchText] = useState("");
  const addPropertyScroll = useRef<HTMLTableSectionElement | null>(null);
  const lastSchemaIdRef = useRef<string | null>(null);

  const { saveSchemaFields, isLoading: isSaving } = useSaveSchemaFields();
  const { data: schemasData } = useGetSchemas({ PageSize: 100 });
  const schemaItems = schemasData?.items || [];
  const dtoSchemas = useMemo(
    () => schemaItems.filter((s) => s.schemaType === 2),
    [schemaItems],
  );
  const [isReadonlyExpanded] = useReadonlyExpanded();

  const schemaType = schema.schemaType;
  const isEmbedded = compactView ?? false;

  const readonlyFieldNames = DEFAULT_NON_EDITABLE_FIELD_NAMES;

  const initialFieldsData = useMemo(() => {
    if (schema.fields && schema.fields.length > 0) {
      const readonlyFields: SchemaField[] = [];
      const editableFields: SchemaField[] = [];

      schema.fields.forEach((field) => {
        const fieldWithId = field.id
          ? field
          : { ...field, id: `field-${field.name}` };

        if (schemaType === 1 && readonlyFieldNames.includes(field.name)) {
          readonlyFields.push(fieldWithId);
        } else {
          editableFields.push(fieldWithId);
        }
      });

      readonlyFields.sort(
        (a, b) =>
          readonlyFieldNames.indexOf(a.name) -
          readonlyFieldNames.indexOf(b.name),
      );

      const sortedFields = [...readonlyFields, ...editableFields];
      return {
        fields: sortedFields,
        fieldNames: sortedFields.map((f) => f.name),
      };
    }

    const initialFields = isEmbedded
      ? []
      : [{ ...DEFAULT_PROPERTY, id: "new-initial" }];
    return {
      fields: initialFields,
      fieldNames: [],
    };
  }, [schema.fields, schemaType, isEmbedded, readonlyFieldNames]);

  const [fields, setFields] = useState<SchemaField[]>(initialFieldsData.fields);
  const [originalFieldNames, setOriginalFieldNames] = useState<string[]>(
    initialFieldsData.fieldNames,
  );

  useEffect(() => {
    if (schema.id !== lastSchemaIdRef.current && !(isEditMode && isDirty)) {
      lastSchemaIdRef.current = schema.id;
      setFields(initialFieldsData.fields);
      setOriginalFieldNames(initialFieldsData.fieldNames);
      setIsEditMode(false);
      setSelectedRows({});
      setExpandedRowIndex(null);
    }
  }, [schema.id, initialFieldsData, isEditMode, isDirty]);

  const readonlyFieldsCount =
    schemaType === 1
      ? fields.filter((p) => DEFAULT_NON_EDITABLE_FIELD_NAMES.includes(p.name))
          .length
      : 0;
  const customFieldsCount =
    schemaType === 1 ? fields.length - readonlyFieldsCount : 0;

  const handleFieldChange = useCallback(
    (index: number, updatedField: Partial<SchemaField>) => {
      setFields((prev) => {
        const newFields = [...prev];
        newFields[index] = { ...newFields[index], ...updatedField };
        return newFields;
      });
      setIsDirty(true);
    },
    [],
  );

  const onNameChange = useCallback(
    (idx: number, name: string) => {
      handleFieldChange(idx, { name });
    },
    [handleFieldChange],
  );

  const onTypeChange = useCallback(
    (idx: number, type: string) => {
      setFields((prev) => {
        const selectedSchema = dtoSchemas.find((s) => s.schemaName === type);
        const newFields = selectedSchema?.fields || [];
        const updated = [...prev];
        updated[idx] = { ...updated[idx], type, fields: newFields };
        return updated;
      });
      setIsDirty(true);
    },
    [dtoSchemas],
  );

  const onArrayChange = useCallback(
    (idx: number, isArray: boolean) => {
      handleFieldChange(idx, { isArray });
    },
    [handleFieldChange],
  );

  const onPiiChange = useCallback(
    (idx: number, isPIIData: boolean) => {
      handleFieldChange(idx, { isPIIData });
    },
    [handleFieldChange],
  );

  const onUniqueChange = useCallback(
    (idx: number, isUniqueData: boolean) => {
      handleFieldChange(idx, { isUniqueData });
    },
    [handleFieldChange],
  );

  const onDescriptionChange = useCallback(
    (idx: number, description: string) => {
      handleFieldChange(idx, { description });
    },
    [handleFieldChange],
  );

  const handleAddField = useCallback(() => {
    setFields((prev) => {
      const newField = { ...DEFAULT_PROPERTY, id: `new-${Date.now()}` };
      return [...prev, newField];
    });
    setIsDirty(true);
    setTimeout(() => {
      addPropertyScroll.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }, 100);
  }, []);

  const handleDeleteField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const handleDuplicateField = useCallback((index: number) => {
    setFields((prev) => {
      const fieldToDuplicate = prev[index];
      const newField: SchemaField = {
        ...fieldToDuplicate,
        id: `dup-${Date.now()}`,
      };
      return [...prev.slice(0, index + 1), newField, ...prev.slice(index + 1)];
    });
    setIsDirty(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    const selectedIndices = Object.entries(selectedRows)
      .filter(([_, selected]) => selected)
      .map(([id, _]) => fields.findIndex((f) => f.id === id || f.name === id))
      .filter((i) => i !== -1)
      .filter((i) => !readonlyFieldNames.includes(fields[i]?.name));

    setFields((prev) => prev.filter((_, i) => !selectedIndices.includes(i)));
    setSelectedRows({});
    setIsDirty(true);
  }, [fields, selectedRows, readonlyFieldNames]);

  const handleBulkDuplicate = () => {
    const selectedIndices = Object.entries(selectedRows)
      .filter(([_, selected]) => selected)
      .map(([id, _]) => fields.findIndex((f) => f.id === id || f.name === id))
      .filter((i) => i !== -1)
      .sort((a, b) => b - a);

    let offset = 0;
    const newFields = [...fields];
    selectedIndices.forEach((originalIndex) => {
      const fieldToDuplicate = fields[originalIndex];
      const duplicated: SchemaField = {
        ...fieldToDuplicate,
        name: `${fieldToDuplicate.name}_copy`,
        id: `dup-${Date.now()}-${originalIndex}`,
      };
      newFields.splice(originalIndex + 1 + offset, 0, duplicated);
      offset++;
    });

    setFields(newFields);
    setSelectedRows({});
    setIsDirty(true);
  };

  const handleSave = async () => {
    const persistedOriginalNames = (schema.fields || [])
      .map((f) => f.name)
      .filter(Boolean);
    const currentNames = fields.map((f) => f.name).filter(Boolean);

    const deletableNames = persistedOriginalNames.filter(
      (name) => !currentNames.includes(name),
    );

    const normalizeField = (f: SchemaField): SchemaField => {
      const { id, fields: nestedFields, ...rest } = f;
      const normalized: SchemaField = {
        name: f.name,
        type: f.type,
        isArray: f.isArray,
        isPIIData: f.isPIIData ?? false,
        isUniqueData: f.isUniqueData ?? false,
        description: f.description ?? "",
        readAccess: f.readAccess ?? { roles: [], permissions: [], users: [] },
        writeAccess: f.writeAccess ?? { roles: [], permissions: [], users: [] },
        deleteAccess: f.deleteAccess ?? {
          roles: [],
          permissions: [],
          users: [],
        },
        totalRoles: f.totalRoles ?? 0,
        totalUsers: f.totalUsers ?? 0,
        totalPermissions: f.totalPermissions ?? 0,
        writeAccessLevel: f.writeAccessLevel ?? 0,
        readAccessLevel: f.readAccessLevel ?? 0,
        deleteAccessLevel: f.deleteAccessLevel ?? 0,
        editAccessLevel: f.editAccessLevel ?? 0,
        totalValidationRules: f.totalValidationRules ?? 0,
        validationRule: f.validationRule ?? null,
      };
      if (
        id &&
        !id.startsWith("new-") &&
        !id.startsWith("dup-") &&
        !id.startsWith("field-")
      ) {
        normalized.id = id;
      }
      if (nestedFields && nestedFields.length > 0) {
        normalized.fields = nestedFields.map(normalizeField);
      }
      return normalized;
    };

    const fieldsToSave = fields
      .filter((f) => f.name.trim() !== "")
      .map((f) => normalizeField(f));

    const success = await saveSchemaFields({
      schemaDefinitionItemId: schema.id,
      fields: fieldsToSave,
      deletableFieldNames: deletableNames,
    });

    if (success) {
      showSuccessToast({ description: "Schema updated successfully" });
      setIsEditMode(false);
      setIsDirty(false);
      setSelectedRows({});
    } else {
      showErrorToast({ description: "Failed to update schema" });
    }
  };

  const handleCancel = () => {
    const restoredFields = schema.fields || [];
    setFields(restoredFields);
    setOriginalFieldNames(restoredFields.map((f) => f.name));
    setIsEditMode(false);
    setIsDirty(false);
    setSelectedRows({});
    setExpandedRowIndex(null);
  };

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedRowIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleSetOpenTypePopoverIndex = useCallback((index: number | null) => {
    setOpenTypePopoverIndex(index);
  }, []);

  const handleSetSearchText = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleEditToggle = useCallback(() => {
    setIsEditMode((prevEditMode) => {
      if (!prevEditMode && !isEmbedded) {
        setFields((prevFields) => {
          const hasEmptyField = prevFields.some((f) => f.name === "");
          if (!hasEmptyField) {
            const newField = { ...DEFAULT_PROPERTY, id: `new-${Date.now()}` };
            return [...prevFields, newField];
          }
          return prevFields;
        });
      }

      return !prevEditMode;
    });
  }, [isEmbedded]);

  const handleRowSelect = useCallback((fieldId: string, selected: boolean) => {
    setSelectedRows((prev) => ({
      ...prev,
      [fieldId]: selected,
    }));
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelectedRows: Record<string, boolean> = {};
      fields.forEach((field) => {
        newSelectedRows[field.id || field.name] = true;
      });
      setSelectedRows(newSelectedRows);
    } else {
      setSelectedRows({});
    }
  };

  const hasSelectedRows = Object.values(selectedRows).some(Boolean);
  const selectedFieldEntries = Object.entries(selectedRows).filter(
    ([_, selected]) => selected,
  );
  const totalFieldLength = fields.length;
  const showEmptyState =
    (totalFieldLength === 0 || totalFieldLength === readonlyFieldsCount) &&
    !isEditMode;
  const showEmptyCustomPropertiesHeader =
    schemaType === 1 && customFieldsCount === 0;
  const shouldHideAccessValidation = false;

  const visibleColumnCount =
    7 + (isEditMode ? 1 : 0) + (shouldHideAccessValidation ? 0 : 1);

  const desktopColumnWidths = isEditMode
    ? shouldHideAccessValidation
      ? ["5%", "19%", "16%", "10%", "10%", "10%", "25%", "5%"]
      : ["5%", "17%", "14%", "10%", "10%", "10%", "18%", "10%", "6%"]
    : shouldHideAccessValidation
      ? ["20%", "17%", "10%", "10%", "10%", "28%", "5%"]
      : ["18%", "16%", "10%", "10%", "10%", "20%", "11%", "5%"];

  const scrollAreaHeightClass = isEmbedded ? "flex-1" : "h-[calc(100vh-450px)]";
  const cardHeightClass = isEmbedded ? "" : "xl:h-[calc(100vh-331px)]";

  if (isLoading) {
    return <SchemaStructureTableSkeleton />;
  }

  if (!schema.id) {
    return (
      <Card className={cn("shadow-none", isEmbedded && "min-w-0")}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          Select a schema from the sidebar to view its structure.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        cardHeightClass,
        "flex flex-col overflow-hidden shadow-none",
        isEmbedded && "min-w-0",
      )}
    >
      {!isEmbedded && (
        <SchemaStructureHeader
          isEditMode={isEditMode}
          isDirty={isDirty}
          isValid={true}
          hasSelectedRows={hasSelectedRows}
          selectedFieldEntriesLength={selectedFieldEntries.length}
          fieldsLength={fields.length}
          schemaName={schema.schemaName}
          schemaType={schemaType}
          onEditToggle={handleEditToggle}
          onSave={handleSave}
          onCancel={handleCancel}
          onBulkDuplicate={handleBulkDuplicate}
          onBulkDelete={handleBulkDelete}
        />
      )}

      <div className={cn("hidden xl:block flex-1 min-h-0")}>
        <ScrollArea
          className={cn(
            scrollAreaHeightClass,
            "flex-1 min-h-0",
            "[scrollbar-gutter:stable]",
          )}
        >
          {isEditMode && isDirty && !isEmbedded && (
            <div className="mx-4 mt-4 mb-4 rounded-md border border-base-warning bg-warning-100 p-4 dark:border-icon-warning dark:bg-warning-800/20">
              <div className="flex items-start gap-2 text-warning-700 dark:text-icon-warning">
                <p className="text-sm">
                  Editing the schema structure properties will impact all areas
                  of the application where they are used.
                </p>
              </div>
            </div>
          )}

          {!(showEmptyState && isEmbedded) && fields.length > 0 && (
            <Table className="w-full table-fixed min-w-0">
              <colgroup>
                {desktopColumnWidths.map((width, index) => (
                  <col key={`desktop-col-${index}`} style={{ width }} />
                ))}
              </colgroup>
              <TableHeader>
                <TableRow>
                  {isEditMode && (
                    <TableHead>
                      {totalFieldLength > 0 && (
                        <Checkbox
                          checked={
                            hasSelectedRows &&
                            selectedFieldEntries.length === fields.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all properties"
                        />
                      )}
                    </TableHead>
                  )}
                  <TableHead>Property name</TableHead>
                  <TableHead>Property type</TableHead>
                  <TableHead className="whitespace-nowrap px-3 text-center md:px-3">
                    IsArray
                  </TableHead>
                  <TableHead className="whitespace-nowrap px-3 text-center md:px-3">
                    IsPII
                  </TableHead>
                  <TableHead className="whitespace-nowrap px-3 pr-5 text-center md:px-3 md:pr-5">
                    IsUnique
                  </TableHead>
                  <TableHead className="px-3 text-left md:px-3">
                    Description
                  </TableHead>
                  {!shouldHideAccessValidation && (
                    <TableHead>
                      <span className="flex items-center gap-1 whitespace-normal">
                        Access <span className="text-muted-foreground">|</span>{" "}
                        Validation
                      </span>
                    </TableHead>
                  )}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={addPropertyScroll}>
                {fields.map((field, index) => {
                  const isReadOnly = readonlyFieldNames.includes(field.name);
                  const isNewField =
                    !originalFieldNames.includes(field.name) && !isReadOnly;
                  const childSchema = findChildSchemaByType(
                    dtoSchemas,
                    field.type,
                  );
                  const isChild = isChildType(dtoSchemas, field.type);
                  const isExpanded = expandedRowIndex === index;
                  const originalField = schema.fields?.find(
                    (f) => f.name === field.name,
                  );

                  const fieldKey = field.id || field.name;
                  return (
                    <React.Fragment key={fieldKey}>
                      <SchemaDesktopRow
                        field={field}
                        index={index}
                        isEditMode={isEditMode}
                        isReadOnly={isReadOnly}
                        isNewField={isNewField}
                        selectedRows={selectedRows}
                        onRowSelect={handleRowSelect}
                        onNameChange={onNameChange}
                        onTypeChange={onTypeChange}
                        onArrayChange={onArrayChange}
                        onPiiChange={onPiiChange}
                        onUniqueChange={onUniqueChange}
                        onDescriptionChange={onDescriptionChange}
                        onDuplicate={handleDuplicateField}
                        onDelete={handleDeleteField}
                        schemaId={schema.id}
                        schemaName={schema.schemaName}
                        schemaType={schemaType}
                        openTypePopoverIndex={openTypePopoverIndex}
                        setOpenTypePopoverIndex={handleSetOpenTypePopoverIndex}
                        schemaItems={dtoSchemas}
                        onTypeSearchChange={handleSetSearchText}
                        searchText={searchText}
                        isExpanded={isExpanded}
                        onToggleExpand={
                          isChild ? handleToggleExpand : undefined
                        }
                        childSchema={childSchema}
                        totalFields={fields.length}
                        totalFieldsLength={totalFieldLength}
                        readonlyFieldsCount={readonlyFieldsCount}
                        customFieldsCount={customFieldsCount}
                        showAccessColumn={schemaType === 1 || isEmbedded}
                        showAccessValidationColumn={!shouldHideAccessValidation}
                        visibleColumnCount={visibleColumnCount}
                        originalFieldFromSchema={originalField}
                      />
                      {isExpanded && childSchema && (
                        <TableRow key={`${field.id || field.name}-expanded`}>
                          <TableCell
                            colSpan={visibleColumnCount}
                            className="bg-muted/30 p-4 align-top dark:bg-muted/25"
                          >
                            <ChildSchemaExpandableContent
                              schemaId={childSchema.id}
                              projectKey={schema.projectKey || ""}
                              rootSchemaId={schema.id}
                              ancestorPath={[field.name]}
                              parentSchemaId={schema.id}
                              parentPropertyName={field.name}
                              parentFieldWithNested={originalField}
                              hideAccessValidation={shouldHideAccessValidation}
                              policyEntitySchemaName={schema.schemaName}
                              onOpenStandaloneSchemaEditor={
                                onOpenStandaloneSchemaEditor
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}

                {showEmptyCustomPropertiesHeader && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={visibleColumnCount}
                      className="bg-muted/30 px-4 py-2"
                    >
                      <div className="text-sm font-medium text-foreground">
                        {schema.schemaName} Properties ({customFieldsCount})
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {showEmptyState && (
            <EmptySchemaPropertyState
              isEmbedded={isEmbedded}
              isReadonlyExpanded={isReadonlyExpanded}
              schema={schema}
              schemaType={schemaType}
              onOpenStandaloneSchemaEditor={onOpenStandaloneSchemaEditor}
              handleAddField={handleAddField}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
            />
          )}
        </ScrollArea>
      </div>

      {isEditMode && !isEmbedded && (
        <div className="border-t px-4 py-3 bg-background">
          <Button variant="outline" onClick={handleAddField}>
            + Add property
          </Button>
        </div>
      )}
    </Card>
  );
}
