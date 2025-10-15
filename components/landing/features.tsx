import { Shield, Clock, MapPin, DollarSign, Star, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Features() {
  const features = [
    {
      icon: MapPin,
      title: "Real-Time Availability",
      description: "See live parking availability on an interactive map. Never waste time searching for a spot again.",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description:
        "Know exactly what you'll pay upfront. No hidden fees, no surprises. Save up to 70% vs traditional lots.",
    },
    {
      icon: Clock,
      title: "Flexible Booking",
      description: "Book instantly or schedule in advance. Hourly, daily, or monthly options available.",
    },
    {
      icon: Shield,
      title: "Secure & Safe",
      description: "Verified hosts, secure payments, and 24/7 support. Your safety is our priority.",
    },
    {
      icon: Star,
      title: "Ratings & Reviews",
      description: "Read reviews from other drivers and hosts. Make informed decisions with community feedback.",
    },
    {
      icon: MessageSquare,
      title: "24/7 Support",
      description: "Get help anytime with our AI chatbot and dedicated support team. We're always here for you.",
    },
  ]

  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-sans">Why Choose ParkShare?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for a seamless parking experience, all in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
