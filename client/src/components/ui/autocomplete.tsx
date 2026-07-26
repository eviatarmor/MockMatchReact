"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { CheckIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Flat option for freeform autocomplete. */
export interface AutocompleteOption {
  readonly value: string
  readonly label?: string
  /** Synthetic “use what you typed” row — not from the dataset. */
  readonly isCustom?: boolean
}

const AutocompleteRoot = AutocompletePrimitive.Root
const AutocompleteValue = AutocompletePrimitive.Value
const AutocompletePortal = AutocompletePrimitive.Portal
const AutocompletePositioner = AutocompletePrimitive.Positioner
const AutocompleteCollection = AutocompletePrimitive.Collection
const AutocompleteGroup = AutocompletePrimitive.Group
const AutocompleteGroupLabel = AutocompletePrimitive.GroupLabel
const AutocompleteEmpty = AutocompletePrimitive.Empty
const AutocompleteStatus = AutocompletePrimitive.Status
const AutocompleteuseFilter = AutocompletePrimitive.useFilter

function AutocompleteInput({
  className,
  ...props
}: AutocompletePrimitive.Input.Props) {
  return (
    <AutocompletePrimitive.Input
      data-slot="autocomplete-input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

function AutocompletePopup({
  className,
  ...props
}: AutocompletePrimitive.Popup.Props) {
  return (
    <AutocompletePrimitive.Popup
      data-slot="autocomplete-popup"
      className={cn(
        "group/autocomplete-popup max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[var(--anchor-width)] origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      {...props}
    />
  )
}

function AutocompleteList({
  className,
  ...props
}: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      data-slot="autocomplete-list"
      className={cn(
        "no-scrollbar max-h-60 scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className
      )}
      {...props}
    />
  )
}

function AutocompleteItem({
  className,
  children,
  ...props
}: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  )
}

function AutocompleteContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  ...props
}: AutocompletePrimitive.Popup.Props &
  Pick<
    AutocompletePrimitive.Positioner.Props,
    "side" | "sideOffset" | "align"
  >) {
  return (
    <AutocompletePortal>
      <AutocompletePositioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className="isolate z-50"
      >
        <AutocompletePopup className={className} {...props} />
      </AutocompletePositioner>
    </AutocompletePortal>
  )
}

export interface FreeformAutocompleteProps {
  readonly value: string
  readonly onChange: (value: string) => void
  /** Dataset options (strings or `{ value, label }`). */
  readonly options: readonly (string | AutocompleteOption)[]
  readonly placeholder?: string
  readonly ariaLabel?: string
  readonly className?: string
  readonly inputClassName?: string
  readonly disabled?: boolean
  /** Max suggestions (not counting the custom row). Default 12. */
  readonly limit?: number
  /**
   * When true (default), show a “Use …” row if the query is not an exact
   * option match so free text is an explicit choice.
   */
  readonly allowCustom?: boolean
  /** i18n: “Use “{query}”” — receives the raw query. */
  readonly customOptionLabel?: (query: string) => string
  /** Empty list copy. */
  readonly emptyLabel?: string
  /**
   * - `default` — bordered form control
   * - `inline` — document-field look (resume canvas)
   */
  readonly variant?: "default" | "inline"
  readonly analysisTarget?: string
  readonly autoFocus?: boolean
  readonly id?: string
}

function normalizeOptions(
  options: readonly (string | AutocompleteOption)[]
): AutocompleteOption[] {
  return options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : { ...opt, label: opt.label ?? opt.value }
  )
}

function optionLabel(opt: AutocompleteOption): string {
  return opt.label ?? opt.value
}

/**
 * Free-text autocomplete: suggestions from a list, but any typed value is
 * valid. Optionally surfaces an explicit “Use custom” row when the query is
 * not an exact match.
 */
function FreeformAutocomplete({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
  inputClassName,
  disabled,
  limit = 12,
  allowCustom = true,
  customOptionLabel,
  emptyLabel = "No matches",
  variant = "default",
  analysisTarget,
  autoFocus,
  id,
}: FreeformAutocompleteProps) {
  const baseOptions = React.useMemo(() => normalizeOptions(options), [options])
  const { contains } = AutocompleteuseFilter({ sensitivity: "base" })

  const filtered = React.useMemo(() => {
    const q = value.trim()
    const matches = !q
      ? baseOptions
      : baseOptions.filter((opt) => contains(optionLabel(opt), q))
    return matches.slice(0, limit)
  }, [baseOptions, value, contains, limit])

  const exactMatch = React.useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return true
    return baseOptions.some((opt) => optionLabel(opt).trim().toLowerCase() === q)
  }, [baseOptions, value])

  const items = React.useMemo((): AutocompleteOption[] => {
    const q = value.trim()
    if (allowCustom && q && !exactMatch) {
      return [
        {
          value: q,
          label: customOptionLabel?.(q) ?? `Use “${q}”`,
          isCustom: true,
        },
        ...filtered,
      ]
    }
    return filtered
  }, [allowCustom, value, exactMatch, customOptionLabel, filtered])

  const inline =
    "pan-ignore w-full bg-transparent p-0 outline-none transition-colors placeholder:text-neutral-300 rounded-[3px] -mx-0.5 px-0.5 hover:bg-blue-500/[0.04] focus:bg-blue-500/[0.06] border-0 shadow-none focus-visible:ring-0 focus-visible:border-transparent h-auto min-h-0 text-inherit md:text-inherit dark:bg-transparent"

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <AutocompleteRoot
        items={items}
        value={value}
        onValueChange={(next) => onChange(next)}
        itemToStringValue={(item) =>
          typeof item === "string" ? item : item.value
        }
        filter={null}
        autoHighlight
        disabled={disabled}
      >
        <AutocompleteInput
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          autoFocus={autoFocus}
          data-analysis-target={analysisTarget}
          className={cn(
            variant === "inline" ? inline : undefined,
            inputClassName
          )}
        />
        <AutocompleteContent>
          <AutocompleteEmpty>
            <div className="px-2 py-2 text-center text-sm text-muted-foreground">
              {emptyLabel}
            </div>
          </AutocompleteEmpty>
          <AutocompleteList>
            {(item: AutocompleteOption) => (
              <AutocompleteItem
                key={item.isCustom ? `__custom:${item.value}` : item.value}
                value={item}
              >
                {item.isCustom ? (
                  <PlusIcon className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <CheckIcon
                    className={cn(
                      "size-3.5 shrink-0",
                      value.trim().toLowerCase() === item.value.trim().toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                )}
                <span className={cn("truncate", item.isCustom && "italic")}>
                  {optionLabel(item)}
                </span>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </AutocompleteRoot>
    </div>
  )
}

export {
  AutocompleteRoot,
  AutocompleteValue,
  AutocompleteInput,
  AutocompletePortal,
  AutocompletePositioner,
  AutocompletePopup,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteCollection,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteEmpty,
  AutocompleteStatus,
  AutocompleteuseFilter,
  FreeformAutocomplete,
}
