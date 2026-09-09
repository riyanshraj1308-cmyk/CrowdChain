import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import Button from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Field";
import Reveal from "../components/ui/Reveal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const STEPS = ["Basics", "Funding", "Milestones", "Review"];
const CATEGORIES = ["Infrastructure", "Hardware", "Healthcare", "Agriculture", "Energy", "Education"];

export default function CreateCampaign() {
  const { isConnected, connect } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    description: "",
    imageUrl: "",
    goal: "",
    deadline: "",
    milestones: [
      { title: "", description: "", amount: "" },
      { title: "", description: "", amount: "" },
    ],
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateMilestone(index, field, value) {
    setForm((f) => {
      const milestones = [...f.milestones];
      milestones[index] = { ...milestones[index], [field]: value };
      return { ...f, milestones };
    });
  }

  function addMilestone() {
    setForm((f) => ({ ...f, milestones: [...f.milestones, { title: "", description: "", amount: "" }] }));
  }

  function removeMilestone(index) {
    setForm((f) => ({ ...f, milestones: f.milestones.filter((_, i) => i !== index) }));
  }

  const milestoneTotal = form.milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const goalNumber = Number(form.goal) || 0;
  const milestonesMatchGoal = form.goal && Math.abs(milestoneTotal - goalNumber) < 0.0000001;

  function validateStep(current) {
    const newErrors = {};
    if (current === 0) {
      if (!form.title.trim() || form.title.length < 3) newErrors.title = "Title must be at least 3 characters.";
      if (!form.description.trim() || form.description.length < 30)
        newErrors.description = "Tell backers more — at least 30 characters.";
    }
    if (current === 1) {
      if (!form.goal || Number(form.goal) <= 0) newErrors.goal = "Enter a funding goal greater than 0.";
      if (!form.deadline) newErrors.deadline = "Choose a deadline.";
      else if (new Date(form.deadline) <= new Date()) newErrors.deadline = "Deadline must be in the future.";
    }
    if (current === 2) {
      form.milestones.forEach((m, i) => {
        if (!m.description.trim()) newErrors[`milestone-${i}`] = "Describe what this milestone delivers.";
        if (!m.amount || Number(m.amount) <= 0) newErrors[`milestone-amount-${i}`] = "Enter an amount greater than 0.";
      });
      if (!milestonesMatchGoal) newErrors.milestoneTotal = "Milestone amounts must add up exactly to your funding goal.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goNext() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!isConnected) {
      connect();
      return;
    }
    setSubmitting(true);
    try {
      // Production flow: call `createCampaign()` on the contract via the
      // connected wallet first, then index the result with the backend.
      // Simulated here since no live contract is attached in this preview.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Campaign created! It's now live for contributions.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <Reveal>
        <h1 className="text-3xl text-ink-950 sm:text-4xl">Start a Campaign</h1>
        <p className="mt-2 text-ink-600">
          Define clear milestones up front — contributors fund with more confidence when they know
          exactly what unlocks each release.
        </p>
      </Reveal>

      <StepIndicator steps={STEPS} current={step} />

      <div className="mt-8 rounded-lg border border-ink-950/10 bg-paper-50 p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <div className="flex flex-col gap-5">
                <Input
                  label="Campaign title"
                  required
                  placeholder="e.g. Solar Water Wells for the Kitui Region"
                  value={form.title}
                  error={errors.title}
                  onChange={(e) => update("title", e.target.value)}
                />
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Textarea
                  label="Description"
                  required
                  rows={6}
                  placeholder="What are you building, why does it matter, and how will contributors know it worked?"
                  value={form.description}
                  error={errors.description}
                  onChange={(e) => update("description", e.target.value)}
                />
                <Input
                  label="Cover image URL"
                  type="url"
                  placeholder="https://…"
                  helperText="A wide image (1200×675 or similar) works best."
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <Input
                  label="Funding goal (ETH)"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="45"
                  error={errors.goal}
                  value={form.goal}
                  onChange={(e) => update("goal", e.target.value)}
                />
                <Input
                  label="Campaign deadline"
                  required
                  type="date"
                  error={errors.deadline}
                  value={form.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                  helperText="If the goal isn't reached by this date, contributors can claim a full refund."
                />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-ink-950">Milestones</h3>
                  <span
                    className={`font-mono text-sm ${
                      milestonesMatchGoal ? "text-moss-600" : "text-ink-500"
                    }`}
                  >
                    {milestoneTotal || 0} / {goalNumber || 0} ETH allocated
                  </span>
                </div>
                {errors.milestoneTotal && (
                  <p className="text-sm text-rust-500">{errors.milestoneTotal}</p>
                )}

                {form.milestones.map((m, i) => (
                  <div key={i} className="rounded-md border border-ink-950/12 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-950">Milestone {i + 1}</span>
                      {form.milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(i)}
                          aria-label={`Remove milestone ${i + 1}`}
                          className="rounded p-1.5 text-ink-400 hover:bg-rust-50 hover:text-rust-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
                      <Input
                        label="Title"
                        placeholder="e.g. Site survey & permits"
                        value={m.title}
                        onChange={(e) => updateMilestone(i, "title", e.target.value)}
                      />
                      <Input
                        label="Amount (ETH)"
                        type="number"
                        min="0"
                        step="0.01"
                        error={errors[`milestone-amount-${i}`]}
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                      />
                    </div>
                    <div className="mt-3">
                      <Textarea
                        label="What has to be true for this milestone to be approved?"
                        rows={3}
                        error={errors[`milestone-${i}`]}
                        value={m.description}
                        onChange={(e) => updateMilestone(i, "description", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="secondary" icon={Plus} onClick={addMilestone} className="self-start">
                  Add another milestone
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-6">
                <ReviewRow label="Title" value={form.title} />
                <ReviewRow label="Category" value={form.category} />
                <ReviewRow label="Goal" value={`${form.goal || 0} ETH`} />
                <ReviewRow label="Deadline" value={form.deadline || "—"} />
                <div>
                  <p className="mb-2 text-sm font-medium text-ink-900">Milestones</p>
                  <ul className="flex flex-col gap-2">
                    {form.milestones.map((m, i) => (
                      <li key={i} className="flex items-center justify-between rounded-md bg-ink-950/4 px-3.5 py-2.5 text-sm">
                        <span className="text-ink-800">{m.title || `Milestone ${i + 1}`}</span>
                        <span className="font-mono text-ink-950">{m.amount || 0} ETH</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-md border border-copper-200 bg-copper-50 p-4 text-sm text-copper-700">
                  Submitting will prompt a wallet transaction to deploy your campaign on-chain, followed
                  by indexing its metadata. Make sure everything above is correct — milestone amounts
                  cannot be changed after launch.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-ink-950/10 pt-6">
          <Button variant="ghost" icon={ArrowLeft} onClick={goBack} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button icon={ArrowRight} iconPosition="right" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button icon={Rocket} loading={submitting} onClick={handleSubmit}>
              {isConnected ? "Launch Campaign" : "Connect Wallet to Launch"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ steps, current }) {
  return (
    <ol className="mt-8 flex items-center gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isDone
                    ? "border-moss-500 bg-moss-500 text-paper-50"
                    : isActive
                    ? "border-ink-950 bg-ink-950 text-paper-50"
                    : "border-ink-950/20 text-ink-400"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={`hidden text-sm font-medium sm:inline ${isActive ? "text-ink-950" : "text-ink-500"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-ink-950/10" />}
          </li>
        );
      })}
    </ol>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-950/8 pb-3">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-medium text-ink-950">{value}</span>
    </div>
  );
}
