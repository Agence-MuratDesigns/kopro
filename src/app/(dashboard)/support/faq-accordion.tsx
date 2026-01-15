'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Euro, Home, Clock, HelpCircle, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem {
  question: string
  answer: string
}

interface FaqCategory {
  title: string
  icon: string
  items: FaqItem[]
}

interface FaqAccordionProps {
  categories: FaqCategory[]
}

// Mapping des icônes par nom
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Euro,
  Home,
  Clock,
  HelpCircle,
}

export function FaqAccordion({ categories }: FaqAccordionProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(categories[0]?.title || null)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const Icon = iconMap[category.icon] || HelpCircle
        const isCategoryOpen = openCategory === category.title

        return (
          <div key={category.title} className="border rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => setOpenCategory(isCategoryOpen ? null : category.title)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Icon className="h-4 w-4 text-primary-600" />
                </div>
                <span className="font-medium text-gray-900">{category.title}</span>
                <span className="text-sm text-gray-500">({category.items.length} questions)</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  isCategoryOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Category Content */}
            {isCategoryOpen && (
              <div className="divide-y">
                {category.items.map((item, index) => {
                  const questionKey = `${category.title}-${index}`
                  const isQuestionOpen = openQuestion === questionKey

                  return (
                    <div key={index} className="bg-white">
                      {/* Question */}
                      <button
                        type="button"
                        onClick={() => setOpenQuestion(isQuestionOpen ? null : questionKey)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-gray-400 flex-shrink-0 transition-transform',
                            isQuestionOpen && 'rotate-180'
                          )}
                        />
                      </button>

                      {/* Answer */}
                      {isQuestionOpen && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
