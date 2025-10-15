"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

export interface FilterOptions {
  spaceTypes: string[]
  features: string[]
  vehicleTypes: string[]
  priceRange: [number, number]
  minRating: number
}

interface SearchBarProps {
  onSearch: (query: string, filters?: FilterOptions) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    spaceTypes: [],
    features: [],
    vehicleTypes: [],
    priceRange: [0, 5000],
    minRating: 0,
  })

  const spaceTypeOptions = ["driveway", "garage", "lot", "street"]
  const featureOptions = ["Covered", "24/7 Access", "Security Camera", "EV Charging", "Well-lit", "Close to Transit"]
  const vehicleTypeOptions = ["sedan", "suv", "truck", "motorcycle", "van"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query, filters)
  }

  const toggleFilter = (category: keyof FilterOptions, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[category] as string[]
      return {
        ...prev,
        [category]: currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      }
    })
  }

  const clearFilters = () => {
    setFilters({
      spaceTypes: [],
      features: [],
      vehicleTypes: [],
      priceRange: [0, 5000],
      minRating: 0,
    })
  }

  const activeFilterCount =
    filters.spaceTypes.length + filters.features.length + filters.vehicleTypes.length + (filters.minRating > 0 ? 1 : 0)

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by location, address, or area..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit">Search</Button>
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="relative bg-transparent">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Space Type Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Space Type</Label>
              <div className="space-y-2">
                {spaceTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`space-${type}`}
                      checked={filters.spaceTypes.includes(type)}
                      onCheckedChange={() => toggleFilter("spaceTypes", type)}
                    />
                    <label htmlFor={`space-${type}`} className="text-sm cursor-pointer capitalize">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Features</Label>
              <div className="space-y-2">
                {featureOptions.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={filters.features.includes(feature)}
                      onCheckedChange={() => toggleFilter("features", feature)}
                    />
                    <label htmlFor={`feature-${feature}`} className="text-sm cursor-pointer">
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Type Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Vehicle Type</Label>
              <div className="space-y-2">
                {vehicleTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`vehicle-${type}`}
                      checked={filters.vehicleTypes.includes(type)}
                      onCheckedChange={() => toggleFilter("vehicleTypes", type)}
                    />
                    <label htmlFor={`vehicle-${type}`} className="text-sm cursor-pointer capitalize">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Price Range (KES per hour): {filters.priceRange[0]} - {filters.priceRange[1]}
              </Label>
              <Slider
                min={0}
                max={5000}
                step={50}
                value={filters.priceRange}
                onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                className="mt-2"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Minimum Rating</Label>
              <div className="flex gap-2">
                {[0, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={filters.minRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters({ ...filters, minRating: rating })}
                  >
                    {rating === 0 ? "Any" : `${rating}+`}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-success hover:bg-success/90"
              onClick={() => {
                onSearch(query, filters)
                setFilterOpen(false)
              }}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </form>
  )
}
