"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  MoreVertical,
  Trash,
  TicketCheck,
  TicketSlash,
  UserRoundPlus,
} from "lucide-react";
import { PropertyTypeSelector } from "./property-type-selector";
import type {
  Schema,
  SchemaField,
  IDataAccessRuleSet,
  IFieldValidationRule,
} from "../../types/data-gateway.types";
import { PRIMITIVE_FIELD_TYPES } from "../../types/data-gateway.types";
import { useReadonlyExpanded } from "../../hooks/use-readonly-expanded";
import { DEFAULT_NON_EDITABLE_FIELD_NAMES } from "../../types/data-gateway.types";
import {
  ACCESS_LEVEL_TO_TYPE,
  ACCESS_TYPE_SHORT_LABELS,
  ACCESS_TYPES,
} from "../../constants/schema-access-control";
import { getValidationDisplayInfo } from "../../utils/schema-normalization";

interface FieldAccessTarget {
  name: string;
  readAccess?: IDataAccessRuleSet;
  writeAccess?: IDataAccessRuleSet;
  deleteAccess?: IDataAccessRuleSet;
}

interface SchemaDesktopRowProps {
  field: SchemaField;
  index: number;
  isEditMode: boolean;
  isReadOnly: boolean;
  isNewField: boolean;
  selectedRows: Record<string, boolean>;
  onRowSelect: (fieldId: string, selected: boolean) => void;
  onNameChange: (index: number, name: string) => void;
  onTypeChange: (index: number, type: string) => void;
  onArrayChange: (index: number, isArray: boolean) => void;
  onPiiChange: (index: number, isPii: boolean) => void;
  onUniqueChange: (index: number, isUnique: boolean) => void;
  onDescriptionChange: (index: number, description: string) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  schemaId: string;
  schemaName: string;
  schemaType: number;
  openTypePopoverIndex: number | null;
  setOpenTypePopoverIndex: (index: number | null) => void;
  schemaItems: Schema[];
  onTypeSearchChange: (value: string) => void;
  searchText: string;
  onOpenAccessDrawer?: (
    fieldTarget: FieldAccessTarget | undefined,
    title: string,
  ) => void;
  onOpenValidationDrawer?: (
    fieldName: string,
    validationRule?: IFieldValidationRule | null,
  ) => void;
  onToggleExpand?: (index: number) => void;
  isExpanded?: boolean;
  childSchema?: Schema | null;
  totalFields: number;
  totalFieldsLength: number;
  readonlyFieldsCount: number;
  customFieldsCount: number;
  showAccessColumn?: boolean;
  showAccessValidationColumn?: boolean;
  visibleColumnCount: number;
  originalFieldFromSchema?: SchemaField | null;
}

const SchemaDesktopRowComponent = ({
  field,
  index,
  isEditMode,
  isReadOnly,
  isNewField,
  selectedRows,
  onRowSelect,
  onNameChange,
  onTypeChange,
  onArrayChange,
  onPiiChange,
  onUniqueChange,
  onDescriptionChange,
  onDuplicate,
  onDelete,
  schemaId: _schemaId,
  schemaName,
  openTypePopoverIndex,
  setOpenTypePopoverIndex,
  schemaItems,
  onTypeSearchChange,
  searchText,
  onOpenAccessDrawer,
  onOpenValidationDrawer,
  isExpanded,
  onToggleExpand,
  childSchema,
  schemaType,
  totalFields,
  totalFieldsLength,
  readonlyFieldsCount,
  customFieldsCount,
  showAccessColumn = true,
  showAccessValidationColumn = true,
  visibleColumnCount,
  originalFieldFromSchema,
}: SchemaDesktopRowProps) => {
  const compactCellClass = "py-3 align-middle";
  const [isReadonlyExpanded, setIsReadonlyExpanded] = useReadonlyExpanded();
  const isPrimitiveType = PRIMITIVE_FIELD_TYPES.includes(
    field.type as (typeof PRIMITIVE_FIELD_TYPES)[number],
  );
  const isChildType = Boolean(childSchema);

  const fieldForValidation = field.fields?.length
    ? field
    : (originalFieldFromSchema ?? field);
  const validationInfo = getValidationDisplayInfo(fieldForValidation);

  const fieldTarget = field.name
    ? {
        name: field.name,
        readAccess: field.readAccess,
        writeAccess: field.writeAccess,
        deleteAccess: field.deleteAccess,
      }
    : undefined;

  const drawerTitle = field.name
    ? `Access for ${field.name}`
    : `Access for ${schemaName}`;

  const hasNonInheritedPolicy = [
    field.readAccessLevel,
    field.writeAccessLevel,
    field.editAccessLevel,
  ].some(
    (level) =>
      (ACCESS_LEVEL_TO_TYPE[level ?? 0] ?? ACCESS_TYPES.INHERITED) !==
      ACCESS_TYPES.INHERITED,
  );

  const isEntityType = schemaType === 1;
  const isFirstRow = isEntityType && index === 0;
  const isFirstCustomField = isEntityType && index === readonlyFieldsCount;
  const isRowVisible =
    (!isEntityType || !isReadOnly || isReadonlyExpanded) &&
    (totalFieldsLength > 0 || isEditMode);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNameChange(index, e.target.value);
  };

  return (
    <>
      {isFirstRow && (
        <TableRow className="hover:bg-transparent">
          <TableCell
            colSpan={visibleColumnCount}
            className="bg-muted/30 px-4 py-2"
          >
            <button
              type="button"
              onClick={() => setIsReadonlyExpanded(!isReadonlyExpanded)}
              className="flex w-full items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isReadonlyExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
              <span>Default Properties ({readonlyFieldsCount})</span>
            </button>
          </TableCell>
        </TableRow>
      )}
      {isFirstCustomField && (
        <TableRow className="hover:bg-transparent">
          <TableCell
            colSpan={visibleColumnCount}
            className="bg-muted/30 px-4 py-2"
          >
            <div className="text-sm font-medium text-foreground">
              {schemaName} Properties ({customFieldsCount})
            </div>
          </TableCell>
        </TableRow>
      )}
      {isRowVisible && (
        <TableRow key={field.id || field.name}>
          {isEditMode && (
            <TableCell className={compactCellClass}>
              {isNewField ? (
                <Checkbox
                  checked={!!selectedRows[field.id || field.name]}
                  onCheckedChange={(value) =>
                    onRowSelect(field.id || field.name, value === true)
                  }
                  disabled={isNewField}
                  aria-label={`Select ${field.name || "property"}`}
                />
              ) : (
                <Checkbox
                  checked={!!selectedRows[field.id || field.name]}
                  onCheckedChange={(value) =>
                    onRowSelect(field.id || field.name, value === true)
                  }
                  aria-label={`Select ${field.name || "property"}`}
                />
              )}
            </TableCell>
          )}

          <TableCell className={compactCellClass}>
            <div className="flex h-9 flex-col justify-center gap-0.5">
              <Input
                value={field.name}
                onChange={handleNameChange}
                placeholder="Click to edit"
                disabled={!isEditMode || isReadOnly}
                className={cn(
                  isEditMode && isReadOnly
                    ? "cursor-not-allowed bg-muted opacity-50"
                    : "",
                )}
              />
            </div>
          </TableCell>

          <TableCell className={compactCellClass}>
            <div className="flex h-9 flex-col justify-center">
              <div className="flex min-w-0 items-center gap-1.5">
                <div className="min-w-0 flex-1">
                  <PropertyTypeSelector
                    index={index}
                    value={field.type}
                    isOpen={openTypePopoverIndex === index}
                    onOpenChange={(open) => {
                      if (!open) setOpenTypePopoverIndex(null);
                      else if (isEditMode && !isReadOnly)
                        setOpenTypePopoverIndex(index);
                    }}
                    onSelect={(type) => {
                      onTypeChange(index, type);
                      setOpenTypePopoverIndex(null);
                    }}
                    isReadOnly={isReadOnly}
                    isEditMode={isEditMode}
                    schemaItems={schemaItems}
                    schemaType={schemaType}
                    onSearchChange={onTypeSearchChange}
                    searchText={searchText}
                    isChildType={isChildType}
                  />
                </div>
                {!isEditMode &&
                  isChildType &&
                  childSchema &&
                  onToggleExpand && (
                    <Tooltip content={isExpanded ? "Collapse" : "Expand"}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleExpand(index)}
                        className={cn(
                          "flex shrink-0 h-6 w-6",
                          isExpanded
                            ? "bg-primary/10 text-primary"
                            : "text-primary hover:bg-primary/10",
                        )}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </Tooltip>
                  )}
              </div>
            </div>
          </TableCell>

          <TableCell
            className={cn(compactCellClass, "px-3 text-center md:px-3")}
          >
            <Switch
              checked={field.isArray}
              onCheckedChange={(checked) => onArrayChange(index, checked)}
              disabled={!isEditMode || isReadOnly}
              size="sm"
            />
          </TableCell>

          <TableCell
            className={cn(compactCellClass, "px-3 text-center md:px-3")}
          >
            <Switch
              checked={field.isPIIData === true}
              onCheckedChange={(checked) => onPiiChange(index, checked)}
              disabled={!isEditMode || isReadOnly || isChildType}
              size="sm"
            />
          </TableCell>

          <TableCell
            className={cn(
              compactCellClass,
              "px-3 pr-5 text-center md:px-3 md:pr-5",
            )}
          >
            <Switch
              checked={field.isUniqueData === true}
              onCheckedChange={(checked) => onUniqueChange(index, checked)}
              disabled={!isEditMode || isReadOnly || isChildType}
              size="sm"
            />
          </TableCell>

          <TableCell className={cn(compactCellClass, "px-3 md:px-3")}>
            <Input
              value={field.description ?? ""}
              onChange={(e) => onDescriptionChange(index, e.target.value)}
              placeholder={isEditMode && !isReadOnly ? "Add description" : "—"}
              disabled={!isEditMode || isReadOnly}
              className="min-w-0"
            />
          </TableCell>

          {showAccessValidationColumn && (
            <TableCell className={compactCellClass}>
              <div className="flex h-9 items-center gap-1">
                {showAccessColumn && (
                  <>
                    <Tooltip
                      content={
                        isEditMode || isNewField || !isPrimitiveType
                          ? "Access control (edit mode)"
                          : "Access control"
                      }
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isEditMode || isNewField || !isPrimitiveType}
                        onClick={() =>
                          onOpenAccessDrawer?.(fieldTarget, drawerTitle)
                        }
                        className={cn(
                          "h-8 w-8",
                          isEditMode || isNewField || !isPrimitiveType
                            ? "opacity-50 cursor-not-allowed"
                            : "text-foreground hover:text-primary",
                        )}
                      >
                        <UserRoundPlus
                          className={cn(
                            "h-4 w-4",
                            hasNonInheritedPolicy && "text-green-500",
                          )}
                        />
                      </Button>
                    </Tooltip>
                    <span className="select-none text-muted-foreground">|</span>
                  </>
                )}

                <Tooltip
                  content={
                    isEditMode || isNewField || !isPrimitiveType
                      ? "Validation (edit mode)"
                      : "Validation rules"
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isEditMode || isNewField || !isPrimitiveType}
                    onClick={() =>
                      onOpenValidationDrawer?.(
                        field.name,
                        fieldForValidation?.validationRule,
                      )
                    }
                    className={cn(
                      "h-8 w-8",
                      isEditMode || isNewField || !isPrimitiveType
                        ? "opacity-50 cursor-not-allowed"
                        : "text-foreground hover:text-primary",
                    )}
                  >
                    {validationInfo.total > 0 ? (
                      <TicketCheck
                        className={cn(
                          "h-4 w-4",
                          validationInfo.hasActive && "text-green-500",
                        )}
                      />
                    ) : (
                      <TicketSlash className="h-4 w-4" />
                    )}
                  </Button>
                </Tooltip>
              </div>
            </TableCell>
          )}

          <TableCell className="py-1 text-right align-middle md:py-1.5">
            {isEditMode && !isReadOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-5 w-5 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onDuplicate(index)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Duplicate</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onDelete(index)}
                  >
                    <Trash className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-500">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const SchemaDesktopRow = React.memo(SchemaDesktopRowComponent);
export default SchemaDesktopRow;
