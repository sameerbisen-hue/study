import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, ThumbsUp, Upload, ShieldCheck, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">StudyShare</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
            <Button asChild className="bg-gradient-primary hover:opacity-90 shadow-elegant"><Link to="/signup">Get started</Link></Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative py-20 md:py-32 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            Share notes. <span className="text-gradient">Learn faster.</span> Together.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A student-friendly hub to upload, discover, review and upvote study materials across every subject.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant">
              <Link to="/signup">Start sharing <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">I have an account</Link></Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Upload, title: "Upload anything", desc: "PDFs, slides, notes, images — drag, drop, done." },
          { icon: Search, title: "Find what you need", desc: "Powerful search and filters by subject, semester, popularity." },
          { icon: ThumbsUp, title: "Upvote what helps", desc: "Surface the best material with community votes and reviews." },
          { icon: Star, title: "Honest reviews", desc: "Rate and comment to help others find quality fast." },
          { icon: ShieldCheck, title: "Moderated", desc: "Report low-quality content. Admins keep things clean." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card hover:shadow-elegant transition">
            <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mb-4">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-10 md:p-14 text-center relative overflow-hidden shadow-elegant">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <h2 className="text-2xl md:text-3xl font-bold relative">Your notes can help thousands of students.</h2>
          <p className="text-primary-foreground/80 mt-2 relative">Join StudyShare in seconds.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6 relative"><Link to="/signup">Create free account</Link></Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} StudyShare · Built for students.
      </footer>
    </div>
  );
};

export default Index;
