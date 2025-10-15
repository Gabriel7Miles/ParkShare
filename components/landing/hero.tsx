import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, DollarSign } from "lucide-react"

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
                Save up to 70% on parking
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance font-sans">
              Find Parking.
              <br />
              <span className="text-primary">Share Spaces.</span>
              <br />
              Save Money.
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
              Connect with parking space owners in your area. Whether you need a spot or have one to share, ParkShare
              makes it simple, secure, and affordable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 bg-transparent">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">500+</p>
                <p className="text-sm text-muted-foreground">Locations</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">Availability</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <p className="text-2xl font-bold">70%</p>
                <p className="text-sm text-muted-foreground">Savings</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-success/20 to-accent/20 p-8">
              <img
                src="/modern-parking-lot-with-cars-and-mobile-app-interf.jpg"
                alt="ParkShare App"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-lg border max-w-xs">
              <p className="text-sm text-muted-foreground mb-2">Active booking</p>
              <p className="font-semibold mb-1">Downtown Parking - Spot A12</p>
              <p className="text-2xl font-bold text-success">KES 850/hr</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
