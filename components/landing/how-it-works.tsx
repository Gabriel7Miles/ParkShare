import { Search, Calendar, CreditCard, CheckCircle } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Search for Parking",
      description: "Enter your destination and find available parking spaces nearby with real-time availability.",
      color: "primary",
    },
    {
      icon: Calendar,
      title: "Book Your Spot",
      description: "Choose your preferred time slot and reserve instantly or schedule for later.",
      color: "success",
    },
    {
      icon: CreditCard,
      title: "Secure Payment",
      description: "Pay securely through the app with multiple payment options and get instant confirmation.",
      color: "accent",
    },
    {
      icon: CheckCircle,
      title: "Park & Go",
      description: "Navigate to your spot, park with confidence, and enjoy your day hassle-free.",
      color: "primary",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-sans">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Finding and booking parking has never been easier. Get started in just four simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-card p-6 rounded-xl border hover:shadow-lg transition-shadow h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      step.color === "primary"
                        ? "bg-primary/10"
                        : step.color === "success"
                          ? "bg-success/10"
                          : "bg-accent/10"
                    }`}
                  >
                    <step.icon
                      className={`w-6 h-6 ${
                        step.color === "primary"
                          ? "text-primary"
                          : step.color === "success"
                            ? "text-success"
                            : "text-accent"
                      }`}
                    />
                  </div>
                  <span className="text-4xl font-bold text-muted-foreground/20">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
