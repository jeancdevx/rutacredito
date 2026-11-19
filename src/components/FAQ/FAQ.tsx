'use client'

import { Accordion } from '@base-ui/react/accordion'
import { PlusIcon } from '@phosphor-icons/react'

export default function FAQ({ items }: { items: string[][] }) {
  return (
    <Accordion.Root className='w-full' multiple>
      {items.map(([question, answer]) => (
        <Accordion.Item key={question} className='border-b border-[#e2d3ca]'>
          <Accordion.Header className='m-0'>
            <Accordion.Trigger className='group flex min-h-16 w-full items-center justify-between gap-5 rounded-none border-0 bg-transparent px-0 py-5 text-left text-[13px] leading-relaxed font-normal text-plum hover:bg-transparent hover:text-coral active:scale-100'>
              {question}
              <span className='grid size-7 shrink-0 place-items-center rounded-full border border-[#ddcec3] transition-transform duration-200 ease-fluid group-data-[panel-open]:rotate-45 motion-reduce:transition-none'>
                <PlusIcon size={14} />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            data-motion='accordion'
            className='h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-fluid data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none'
          >
            <div className='pr-8 pb-5 text-[13px] leading-7 text-muted'>
              {answer}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
