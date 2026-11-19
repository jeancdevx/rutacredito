'use client'

import { Select as Primitive } from '@base-ui/react/select'
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Children, Fragment, isValidElement } from 'react'

export type SelectOptionProps = {
  value: string
  children: ReactNode
  disabled?: boolean
}

// Declarative option metadata; rendered by Base UI, never by the browser's
// native option menu. The wrapper preserves a small, explicit public API.
export function SelectOption(_props: SelectOptionProps) {
  return null
}

function labelText(node: ReactNode): string {
  return Children.toArray(node)
    .map(child =>
      isValidElement<{ children?: ReactNode }>(child)
        ? labelText(child.props.children)
        : String(child)
    )
    .join('')
}

function optionsFrom(children: ReactNode): SelectOptionProps[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<SelectOptionProps>(child)) return []

    if (child.type === Fragment) return optionsFrom(child.props.children)

    return [{ ...child.props, children: labelText(child.props.children) }]
  })
}

export type SelectProps = {
  children: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export default function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  name,
  id,
  className = '',
  ...aria
}: SelectProps) {
  const options = optionsFrom(children)

  return (
    <Primitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={value => {
        if (value !== null) onValueChange?.(value)
      }}
      items={options.map(o => ({ value: o.value, label: o.children }))}
      required={required}
      disabled={disabled}
      name={name}
    >
      <Primitive.Trigger
        id={id}
        className={`ui-select-trigger flex min-h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-[#d9cac2] bg-surface px-3.5 py-2.5 text-left text-[13px] leading-normal font-normal text-plum shadow-xs transition-[background-color,border-color] duration-150 hover:border-[#b99c8b] hover:bg-[#fffaf1] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-plum disabled:cursor-not-allowed disabled:opacity-50 data-[popup-open]:border-coral data-[popup-open]:bg-[#fffaf2] data-[popup-open]:ring-3 data-[popup-open]:ring-coral/8 motion-reduce:transition-none ${className}`}
        {...aria}
      >
        <Primitive.Value className='min-w-0 truncate' />
        <Primitive.Icon className='ui-select-chevron flex shrink-0 text-[#9a7c70] transition-transform duration-150 motion-reduce:transition-none'>
          <CaretDownIcon size={15} />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Positioner
          className='ui-select-positioner z-[100] max-w-[calc(100vw-24px)] font-sans outline-none'
          sideOffset={7}
          align='start'
          alignItemWithTrigger={false}
        >
          <Primitive.Popup
            data-motion='popover'
            className='w-max max-w-[min(480px,calc(100vw-24px))] min-w-(--anchor-width) origin-(--transform-origin) rounded-xl border border-[#dfd0c4] bg-surface p-1.5 text-plum shadow-[0_12px_36px_#38263d18,0_2px_6px_#38263d08] transition-[opacity,transform] duration-200 ease-fluid outline-none data-[ending-style]:-translate-y-1 data-[ending-style]:scale-97 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[starting-style]:-translate-y-1 data-[starting-style]:scale-97 data-[starting-style]:opacity-0 motion-reduce:transition-opacity motion-reduce:duration-150 motion-reduce:data-starting-style:translate-y-0 motion-reduce:data-starting-style:scale-100 motion-reduce:data-[ending-style]:translate-y-0 motion-reduce:data-[ending-style]:scale-100'
          >
            <Primitive.List className='flex max-h-[min(320px,var(--available-height))] [scrollbar-width:thin] flex-col gap-y-1 overflow-auto overscroll-contain outline-none'>
              {options.map(option => (
                <Primitive.Item
                  key={option.value}
                  value={option.value}
                  data-value={option.value}
                  disabled={option.disabled}
                  className='ui-select-item flex min-h-11 cursor-pointer items-center justify-between gap-5 rounded-lg px-2.5 py-2 text-left text-[13px] leading-normal text-plum outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[highlighted]:bg-[#f0e5d8] data-[selected]:bg-[#f7e8db] data-[selected]:font-semibold data-[selected]:text-[#9e3b2b] min-[701px]:min-h-9 min-[701px]:text-xs'
                >
                  <Primitive.ItemText className='max-w-full text-left whitespace-normal'>
                    {option.children}
                  </Primitive.ItemText>
                  <Primitive.ItemIndicator className='flex shrink-0 items-center text-coral'>
                    <CheckIcon size={14} weight='bold' />
                  </Primitive.ItemIndicator>
                </Primitive.Item>
              ))}
            </Primitive.List>
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
