import Link from "next/link";
import {
  Youtube,
  Sparkles,
  Download,
  Mail,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";

// How It Works Steps
const steps = [
  {
    number: "01",
    icon: Youtube,
    title: "Paste YouTube URL",
    description: "Simply paste any YouTube video link into the input field",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI Analyzes Content",
    description: "Our AI extracts the transcript and structures the content",
  },
  {
    number: "03",
    icon: Download,
    title: "Get Your Newsletter",
    description: "Receive a ready-to-send newsletter in seconds",
  },
];

// Features
const features = [
  {
    title: "Elite Writing",
    description: "Newsletter-quality content inspired by Lenny, James Clear, and Sahil Bloom",
  },
  {
    title: "Instant Generation",
    description: "Transform any YouTube video into a newsletter in under a minute",
  },
  {
    title: "Ready to Send",
    description: "Copy and paste directly into your email platform",
  },
  {
    title: "Full Ownership",
    description: "Your content, your audience, no restrictions",
  },
];

// FAQ Data
const faqs = [
  {
    question: "What types of videos work best?",
    answer: "Educational content, tutorials, interviews, and informational videos work best. The AI extracts key points and structures them into readable newsletter content.",
  },
  {
    question: "How long does it take to generate?",
    answer: "Most newsletters are generated in 30-60 seconds, depending on the video length and transcript complexity.",
  },
  {
    question: "Can I edit the generated content?",
    answer: "Yes! Copy the newsletter to your favorite editor and customize it to match your voice and style.",
  },
  {
    question: "Does the video need captions?",
    answer: "Yes, the video must have captions (auto-generated or manual) for our AI to extract the content.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-6xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <Mail className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Newsletter</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Newsletter Generation
            </div>
            
            {/* Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
              Turn YouTube Videos into{" "}
              <span className="text-primary">Elite Newsletters</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform any YouTube video into a high-value newsletter your readers will love.
              Save hours of writing with AI that writes like the best newsletter authors.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-all hover:bg-accent"
              >
                See How It Works
              </a>
            </div>
            
            {/* Social Proof */}
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Free to try</span> • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/30 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to transform your video content
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
                )}
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="text-xs font-medium text-primary mb-2">{step.number}</div>
                  <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Create newsletters that your audience will love
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card border transition-all hover:shadow-lg hover:border-primary/20"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-lg border bg-card overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-4 text-left font-medium hover:bg-muted/50 transition-colors">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Ready to Create Your First Newsletter?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Transform any YouTube video into an engaging newsletter in seconds.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-1.5">
                <Mail className="size-4 text-primary-foreground" />
              </div>
              <span className="font-medium">Newsletter Generator</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Newsletter Generator
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
