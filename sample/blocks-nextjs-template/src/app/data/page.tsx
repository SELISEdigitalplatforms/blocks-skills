"use client"

import { Database, FileText, BarChart3 } from "lucide-react"

export default function DataDashboard() {
  const features = [
    {
      title: "Schemas",
      description: "Manage your data schemas and collections",
      icon: Database,
      href: "/data/data-gateway/schemas",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Files",
      description: "Upload and manage your files",
      icon: FileText,
      href: "/data/data-gateway/files",
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Explorer",
      description: "Browse and query your data",
      icon: BarChart3,
      href: "/data/data-gateway/explorer",
      color: "bg-purple-500/10 text-purple-500",
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 border-b border-white/10">
        <h1 className="text-3xl font-bold text-white">Data Dashboard</h1>
        <p className="text-white/50 mt-2">
          Manage your data, files, and content with the Data Gateway
        </p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              className="group p-6 rounded-xl border border-white/10 bg-neutral-900 hover:bg-neutral-800 transition-all hover:border-white/20"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-sm text-white/50">{feature.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
