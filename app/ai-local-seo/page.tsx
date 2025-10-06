"use client"

import React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AILocalSEOPage() {
  return (
    <DashboardLayout title="AI Local SEO" subtitle="Get Free Local SEO for Your Business" currentPath="/ai-local-seo">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-4xl">⚡</div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">✨ Free Local SEO in Your City</h1>
            <h2 className="mt-2 text-lg text-gray-700">Get your <strong>First Year Free</strong> (Worth <strong>₹19,999/- per year</strong>) with CRM</h2>
          </div>
        </div>

        <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">How it works — Step by step</h3>
          <ol className="space-y-4 list-decimal list-inside text-gray-700">
            <li>
              <strong>Step 1:</strong> Give access to your Google Business Profile → <span className="font-medium">magicseoaitool@gmail.com</span>
            </li>
            <li>
              <strong>Step 2:</strong> Fill this form to start your free process → <a className="text-blue-600 underline" href="https://tally.so/r/megOKJ" target="_blank" rel="noreferrer">Click Here</a>
            </li>
          </ol>
        </section>

        <section className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">What You Will Get</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>Keyword-based strategy for higher local search rankings</li>
            <li>Content posting &amp; optimization to keep your profile active</li>
            <li>Backlink suggestions to strengthen online authority</li>
            <li>Customer reviews monitoring for better brand trust</li>
            <li>Local map ranking boost to attract nearby customers</li>
          </ul>
        </section>

        <section className="p-6 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <p className="text-gray-700 mb-3"><span className="text-blue-700 font-semibold">Free Local SEO – First Year Free</span> — Regular price <span className="font-semibold">₹19,999/- per year</span></p>

            <div className="mt-4">
              <a href="https://tally.so/r/megOKJ" target="_blank" rel="noreferrer" className="inline-block bg-blue-600 text-white px-5 py-3 rounded-md font-medium shadow hover:bg-blue-700">
                Start Free SEO
              </a>
            </div>
          </div>
        </section>

        {/* Membership Notice */}
        <section className="mt-10">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Note: This feature is available only for active members. Trial users are not eligible.
            </p>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
