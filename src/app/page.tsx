"use client";

import {
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { logError, logInfo, getUserFriendlyMessage, isRetryableError } from "@/lib/error-logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { renderReportHtml } from "@/lib/report-to-html";
import { generateEnhancedReport } from "@/lib/report";
import type { BusinessPrefill } from "@/lib/prefill";
import type {
  KeywordStat,
  PageAnalysis,
  SeoReport,
  PageContentDraft,
  SiteArchitectureEntry,
} from "@/lib/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  DownloadCloud,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  MAX_COMPETITORS_IN_FORM,
  COPY_FEEDBACK_TIMEOUT_MS,
  PROGRESS_MESSAGE_INTERVAL_MS,
  STORAGE_KEY_REPORT,
  STORAGE_KEY_FORM,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const PROGRESS_MESSAGES = [
  "Crawling the target site map…",
  "Profiling competitor intent clusters…",
  "Pulling Moz authority and Mozscape metrics…",
  "Scoring keyword opportunities…",
  "Drafting metadata and content playbooks…",
];

const PIPELINE_STEPS = [
  { key: "crawl", label: "Crawl" },
  { key: "profile", label: "Analyse" },
  { key: "moz", label: "Benchmark" },
  { key: "score", label: "Prioritise" },
  { key: "draft", label: "Draft" },
];

type ActivityTone = "success" | "info" | "warning" | "error";

type ActivityEntry = {
  id: string;
  label: string;
  description?: string;
  tone: ActivityTone;
  timestamp: number;
};

type FormState = {
  businessName: string;
  website: string;
  businessType: string;
  businessAddress: string;
  serviceArea: string;
  googleBusinessProfile: string;
  additionalNotes: string;
  competitors: string[];
  useSenseCheck: boolean;
};

const MAX_COMPETITORS = MAX_COMPETITORS_IN_FORM;

const defaultForm: FormState = {
  businessName: "",
  website: "",
  businessType: "",
  businessAddress: "",
  serviceArea: "",
  googleBusinessProfile: "",
  additionalNotes: "",
  competitors: [""],
  useSenseCheck: true,
};

const inputClasses = "input-enhanced";

const textareaClasses = "input-enhanced min-h-[120px]";

/**
 * URLLink - Display URL as styled link (SEMrush/Ahrefs pattern)
 * Icon + domain + external indicator
 */
function URLLink({ url, className = "" }: { url: string; className?: string }) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`url-link ${className}`}
      >
        <Globe className="url-link-icon" />
        <span className="url-link-text">{domain}</span>
        <ExternalLink className="url-link-external" />
      </a>
    );
  } catch {
    // Fallback for invalid URLs
    return <span className="text-zinc-400 text-sm">{url}</span>;
  }
}

export default function Home() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [report, setReport] = useState<SeoReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string>(
    PROGRESS_MESSAGES[0]
  );
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [prefillNotes, setPrefillNotes] = useState<string[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCompetitorWarning, setShowCompetitorWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);
  const [mozStatus, setMozStatus] = useState<{
    isValid: boolean;
    hasCredits: boolean;
    error?: string;
  } | null>(null);
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  const addActivity = useCallback(
    (entry: { label: string; description?: string; tone?: ActivityTone }) => {
      const now = Date.now();
      setActivityLog((prev) => {
        const next: ActivityEntry[] = [
          {
            id: `${now}-${Math.random().toString(16).slice(2)}`,
            timestamp: now,
            tone: entry.tone ?? "info",
            label: entry.label,
            description: entry.description,
          },
          ...prev,
        ];
        return next.slice(0, 12);
      });
    },
    []
  );

  const hasReport = !!report;
  const hasContentDrafts = hasReport && Boolean(report?.contentDrafts?.length);
  const hasRecommendations = hasReport && Boolean(report?.recommendations?.length);
  const reportHtml = useMemo(() => {
    if (!report) return "";
    // Use enhanced report if ANY phase data is present
    const hasEnhancedData = report.intelligence || report.strategy || report.blueprints || report.generatedContent;
    return hasEnhancedData ? generateEnhancedReport(report) : renderReportHtml(report);
  }, [report]);

  // Check Moz API status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    fetch("/api/health/moz")
      .then((res) => res.json())
      .then((data) => {
        setMozStatus({
          isValid: data.isValid ?? false,
          hasCredits: data.hasCredits ?? false,
          error: data.error,
        });
      })
      .catch((err) => {
        console.warn("Failed to check Moz status", err);
        setMozStatus({
          isValid: false,
          hasCredits: false,
          error: "Unable to verify Moz API status",
        });
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedReport = window.localStorage.getItem(STORAGE_KEY_REPORT);
      const storedForm = window.localStorage.getItem(STORAGE_KEY_FORM);

      if (storedReport) {
        const parsedReport = JSON.parse(storedReport) as SeoReport;
        setReport({
          ...parsedReport,
          senseCheck: {
            enabled: parsedReport.senseCheck?.enabled ?? true,
            flaggedKeywords: parsedReport.senseCheck?.flaggedKeywords ?? [],
            notes: parsedReport.senseCheck?.notes ?? [],
          },
          siteArchitecture: parsedReport.siteArchitecture ?? [],
          recommendations: parsedReport.recommendations ?? [],
          contentDrafts: parsedReport.contentDrafts ?? [],
          keywordOpportunities: {
            ...parsedReport.keywordOpportunities,
            localityKeywords:
              parsedReport.keywordOpportunities.localityKeywords ?? [],
          },
        });
      }

      if (storedForm) {
        const parsedForm = JSON.parse(storedForm) as FormState;
        setForm({ ...defaultForm, ...parsedForm });
      }
    } catch (storageError) {
      console.warn("Failed to hydrate saved state", storageError);
    } finally {
      setHasHydrated(true);
    }

    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    addActivity({
      label: "SEOWizard ready",
      description: "Prefill from Google or jump straight into a fresh strategy.",
      tone: "info",
    });
  }, [addActivity]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydrated) return;
    try {
      if (report) {
        window.localStorage.setItem(STORAGE_KEY_REPORT, JSON.stringify(report));
      } else {
        window.localStorage.removeItem(STORAGE_KEY_REPORT);
      }
    } catch (storageError) {
      console.warn("Failed to persist report", storageError);
    }
  }, [report, hasHydrated]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(form));
    } catch (storageError) {
      console.warn("Failed to persist form", storageError);
    }
  }, [form, hasHydrated]);

  const handlePrefill = useCallback(async () => {
    const gbp = form.googleBusinessProfile.trim();
    if (!gbp) {
      setPrefillError("Add a Google Business Profile link first.");
      toast.warning("Google Business Profile link required", {
        description: "Please add a Google Business Profile link before using prefill.",
      });
      return;
    }

    setPrefillError(null);
    setPrefillNotes([]);
    setIsPrefilling(true);

    const loadingToastId = toast.loading("Fetching business details from Google...");

    try {
      const response = await fetch("/api/prefill", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ googleBusinessProfile: gbp }),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(
          message?.message ??
            "Something went wrong while reading the Google Business Profile."
        );
      }

      const data: {
        prefill: BusinessPrefill;
        notes?: string[];
      } = await response.json();

      setForm((prev) => ({
        ...prev,
        businessName: data.prefill.businessName ?? prev.businessName,
        website: data.prefill.website ?? prev.website,
        businessType: data.prefill.businessType ?? prev.businessType,
        businessAddress: data.prefill.businessAddress ?? prev.businessAddress,
        serviceArea: data.prefill.serviceArea ?? prev.serviceArea,
        additionalNotes: data.prefill.additionalNotes ?? prev.additionalNotes,
      }));

      if (data.notes?.length) {
        setPrefillNotes(data.notes);
      }

      toast.dismiss(loadingToastId);
      toast.success("Business details prefilled successfully", {
        description: "Review and adjust the fields as needed.",
      });

      addActivity({
        label: "Prefill complete",
        tone: "success",
        description:
          data.prefill.businessName?.length || form.businessName
            ? `Synced profile details for ${data.prefill.businessName ?? form.businessName}.`
            : "Synced Google Business Profile details.",
      });

      logInfo("Prefill successful", {
        component: "Home",
        action: "prefill",
        metadata: { hasNotes: Boolean(data.notes?.length) },
      });
    } catch (prefillErr) {
      const errorMessage = getUserFriendlyMessage(prefillErr);
      setPrefillError(
        prefillErr instanceof Error
          ? prefillErr.message
          : "Unexpected error while pre-filling."
      );

      toast.dismiss(loadingToastId);

      const isRetryable = isRetryableError(prefillErr);
      toast.error("Failed to prefill business details", {
        description: errorMessage,
        action: isRetryable
          ? {
              label: "Retry",
              onClick: handlePrefill,
            }
          : undefined,
        duration: 6000,
      });

      addActivity({
        label: "Prefill failed",
        tone: "error",
        description: errorMessage,
      });

      logError(
        prefillErr instanceof Error ? prefillErr : new Error(String(prefillErr)),
        {
          component: "Home",
          action: "prefill",
          metadata: { googleBusinessProfile: gbp },
        },
        "medium"
      );
    } finally {
      setIsPrefilling(false);
    }
  }, [addActivity, form.businessName, form.googleBusinessProfile, toast]);

  useEffect(() => {
    if (isGenerating) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      let index = 0;
      setGenerationMessage(PROGRESS_MESSAGES[index]);
      progressInterval.current = setInterval(() => {
        index = Math.min(index + 1, PROGRESS_MESSAGES.length - 1);
        setGenerationMessage(PROGRESS_MESSAGES[index]);
        if (index === PROGRESS_MESSAGES.length - 1 && progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }, PROGRESS_MESSAGE_INTERVAL_MS);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setGenerationMessage(PROGRESS_MESSAGES[0]);
    }
  }, [isGenerating]);

  const performGeneration = async () => {
    setError(null);
    setGenerationMessage(PROGRESS_MESSAGES[0]);
    setIsGenerating(true);

    try {
      const payload = {
        businessName: form.businessName.trim(),
        website: form.website.trim(),
        businessType: form.businessType.trim(),
        businessAddress: form.businessAddress.trim(),
        serviceArea: form.serviceArea.trim(),
        googleBusinessProfile: form.googleBusinessProfile.trim(),
        additionalNotes: form.additionalNotes.trim(),
        competitors: form.competitors
          .map((entry) => entry.trim())
          .filter(Boolean),
        useSenseCheck: form.useSenseCheck,
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);

        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = message?.retryAfter ?? 60;
          throw new Error(
            `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          );
        }

        throw new Error(
          message?.message ??
            "Something went wrong while generating your report."
        );
      }

      const data: SeoReport = await response.json();
      setReport({
        ...data,
        senseCheck: {
          enabled: data.senseCheck?.enabled ?? true,
          flaggedKeywords: data.senseCheck?.flaggedKeywords ?? [],
          notes: data.senseCheck?.notes ?? [],
        },
        siteArchitecture: data.siteArchitecture ?? [],
        recommendations: data.recommendations ?? [],
        contentDrafts: data.contentDrafts ?? [],
        keywordOpportunities: {
          ...data.keywordOpportunities,
          localityKeywords: data.keywordOpportunities.localityKeywords ?? [],
        },
      });

      const keywordCount =
        data.keywordOpportunities.strongestKeywords.length +
        data.keywordOpportunities.quickWins.length +
        data.keywordOpportunities.contentGaps.length +
        (data.keywordOpportunities.localityKeywords?.length || 0);

      toast.success("SEO strategy generated successfully!", {
        description: `Found ${keywordCount} keyword opportunities for ${form.businessName}.`,
        duration: 5000,
      });

      logInfo("Report generation successful", {
        component: "Home",
        action: "generate",
        metadata: {
          businessName: form.businessName,
          keywordCount,
          competitorCount: form.competitors.filter(Boolean).length,
        },
      });

      addActivity({
        label: "Strategy generated",
        tone: "success",
        description: `Surfaced ${keywordCount} keyword opportunities.`,
      });
    } catch (cause) {
      const errorMessage = getUserFriendlyMessage(cause);
      setError(
        cause instanceof Error ? cause.message : "Unexpected error occurred."
      );

      const isRetryable = isRetryableError(cause);
      toast.error("Failed to generate SEO strategy", {
        description: errorMessage,
        action: isRetryable
          ? {
              label: "Retry",
              onClick: performGeneration,
            }
          : undefined,
        duration: 8000,
      });

      addActivity({
        label: "Generation failed",
        tone: "error",
        description: errorMessage,
      });

      logError(
        cause instanceof Error ? cause : new Error(String(cause)),
        {
          component: "Home",
          action: "generate",
          metadata: {
            businessName: form.businessName,
            website: form.website,
          },
        },
        "high"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const competitorCount = form.competitors.filter((c) => c.trim()).length;

    // Show warning if no competitors provided
    if (competitorCount === 0) {
      setPendingSubmit(() => performGeneration);
      setShowCompetitorWarning(true);
      return;
    }

    await performGeneration();
  };

  const confirmGenerateWithoutCompetitors = async () => {
    setShowCompetitorWarning(false);
    if (pendingSubmit) {
      await pendingSubmit();
      setPendingSubmit(null);
    }
  };

  const confirmReset = () => {
    setForm(defaultForm);
    setReport(null);
    setError(null);
    setPrefillError(null);
    setPrefillNotes([]);
    setShowResetConfirm(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY_REPORT);
      window.localStorage.removeItem(STORAGE_KEY_FORM);
    }

    toast.success("Everything reset", {
      description: "All form data and reports have been cleared.",
    });

    logInfo("User reset all data", {
      component: "Home",
      action: "reset",
    });
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleCopy = useCallback(
    async (key: string, value: string) => {
      if (!value) return;
      try {
        if (copyTimeout.current) {
          clearTimeout(copyTimeout.current);
        }

        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(value);
        } else if (typeof document !== "undefined") {
          const textarea = document.createElement("textarea");
          textarea.value = value;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        setCopyTarget(key);
        copyTimeout.current = setTimeout(() => setCopyTarget(null), COPY_FEEDBACK_TIMEOUT_MS);

        toast.success("Copied to clipboard", {
          duration: 2000,
        });
      } catch (copyError) {
        console.warn("Failed to copy", copyError);
        toast.error("Failed to copy", {
          description: "Could not copy to clipboard. Please try again.",
          duration: 3000,
        });

        logError(
          copyError instanceof Error ? copyError : new Error("Copy failed"),
          {
            component: "Home",
            action: "copy",
            metadata: { key },
          },
          "low"
        );
      }
    },
    [toast]
  );

  const handleDownloadHtml = () => {
    if (!report) return;

    try {
      const html = reportHtml || renderReportHtml(report);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `${slugify(report.input.businessName)}-seo-blueprint.html`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report downloaded", {
        description: `${filename} has been saved to your downloads.`,
        duration: 3000,
      });

      logInfo("Report downloaded", {
        component: "Home",
        action: "download",
        metadata: { businessName: report.input.businessName },
      });

      addActivity({
        label: "Report exported",
        tone: "success",
        description: `${filename} saved to downloads.`,
      });
    } catch (downloadError) {
      toast.error("Failed to download report", {
        description: "Could not generate download. Please try again.",
        duration: 4000,
      });

      logError(
        downloadError instanceof Error ? downloadError : new Error("Download failed"),
        {
          component: "Home",
          action: "download",
        },
        "low"
      );

      addActivity({
        label: "Export failed",
        tone: "error",
        description: "Unable to generate the HTML download.",
      });
    }
  };

  const keywordScore = useMemo(() => {
    if (!report) return 0;
    return Math.min(
      100,
      Math.round(
        report.keywordOpportunities.strongestKeywords.reduce(
          (total, keyword) => total + keyword.score,
          0
        )
      )
    );
  }, [report]);

const latestActivity = activityLog[0];

  return (
    <TooltipProvider delayDuration={150}>
      <main className="relative min-h-screen overflow-hidden bg-[#050713] text-base text-slate-100">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(115%_85%_at_85%_0%,rgba(124,58,237,0.28),transparent),radial-gradient(90%_90%_at_10%_10%,rgba(37,99,235,0.2),transparent)]" />

        {/* Staged Wizard Layout */}
        {!hasReport ? (
          // STAGE 1: Input Form Only - Centered, focused layout
          <div className="fade-in mx-auto w-full max-w-[800px] px-6 pb-24 pt-12 md:px-10">
            <HeroHeader mozStatus={mozStatus} />
            <div className="mt-6">
              <ProgressTicker
                message={generationMessage}
                isRunning={isGenerating}
                hasReport={hasReport}
                keywordScore={keywordScore}
              />
            </div>
            <div className="mt-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <FormSection
                title="Quick start"
                description="Paste your Google Business Profile URL to auto-fill business details."
              >
                <FieldGroup
                  fieldId="google-business-profile"
                  label="Google Business Profile"
                >
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <Input
                        id="google-business-profile"
                        value={form.googleBusinessProfile}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            googleBusinessProfile: event.target.value,
                          }))
                        }
                        placeholder="https://maps.app.goo.gl/..."
                        className={cn(inputClasses, "w-full")}
                        disabled={isPrefilling || isGenerating}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "btn-secondary shrink-0 px-4 py-2 text-xs uppercase tracking-[0.22em]"
                        )}
                        onClick={handlePrefill}
                        disabled={isPrefilling || isGenerating}
                      >
                        {isPrefilling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Prefilling…
                          </>
                        ) : (
                          "Prefill"
                        )}
                      </Button>
                    </div>
                    {prefillError && (
                      <Alert variant="destructive" className="relative">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-start justify-between gap-3 text-sm">
                          <span className="flex-1 text-xs leading-relaxed">{prefillError}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPrefillError(null)}
                            className="h-5 w-5 shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    {prefillNotes.length ? (
                      <ul className="space-y-2">
                        {prefillNotes.map((note, index) => {
                          const isWarning = /unable|missing|limited|fail/i.test(note);
                          const Icon = isWarning ? AlertTriangle : CheckCircle2;
                          const tone = isWarning ? "text-amber-300" : "text-emerald-300";
                          return (
                            <li
                              key={`${note}-${index}`}
                              className="flex items-start gap-2 text-xs text-zinc-400"
                            >
                              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
                              <span className="leading-relaxed">{note}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </FieldGroup>
              </FormSection>

              <FormSection
                title="Business essentials"
                description="Set the core identity that informs tone, metadata, and AI reasoning."
              >
                <div className="grid gap-4">
                  <FieldGroup fieldId="business-name" label="Business name">
                    <Input
                      required
                      id="business-name"
                      value={form.businessName}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          businessName: event.target.value,
                        }))
                      }
                      placeholder="Little Copa"
                      className={inputClasses}
                    />
                  </FieldGroup>
                  <FieldGroup fieldId="business-website" label="Website">
                    <Input
                      required
                      type="url"
                      id="business-website"
                      value={form.website}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          website: event.target.value,
                        }))
                      }
                      placeholder="https://littlecopa.com"
                      className={inputClasses}
                    />
                  </FieldGroup>
                  <FieldGroup fieldId="business-type" label="Business type">
                    <Input
                      required
                      id="business-type"
                      value={form.businessType}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          businessType: event.target.value,
                        }))
                      }
                      placeholder="Italian restaurant"
                      className={inputClasses}
                    />
                  </FieldGroup>
                </div>
              </FormSection>

              <FormSection
                title="Local presence"
                description="We reshape keyword clusters and content to reflect how and where you operate."
              >
                <div className="grid gap-4">
                  <FieldGroup fieldId="business-address" label="Business address">
                    <Textarea
                      id="business-address"
                      value={form.businessAddress}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          businessAddress: event.target.value,
                        }))
                      }
                      placeholder="18 Howe St, Edinburgh EH3"
                      className={textareaClasses}
                      rows={3}
                    />
                  </FieldGroup>
                  <FieldGroup fieldId="service-area" label="Primary service area">
                    <Input
                      id="service-area"
                      value={form.serviceArea}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          serviceArea: event.target.value,
                        }))
                      }
                      placeholder="Stockbridge, Edinburgh"
                      className={inputClasses}
                    />
                  </FieldGroup>
                </div>
              </FormSection>

              <FormSection
                title="Strategic signals"
                description="Add context, guardrails, and competitor benchmarks before generating your blueprint."
              >
                <div className="space-y-5">
                  <FieldGroup fieldId="strategic-notes" label="Strategic notes">
                    <Textarea
                      id="strategic-notes"
                      value={form.additionalNotes}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          additionalNotes: event.target.value,
                        }))
                      }
                      placeholder="Call out tone of voice, upcoming launches, or differentiators."
                      className="input-enhanced min-h-[140px]"
                    />
                  </FieldGroup>

                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">
                          AI sense check
                        </p>
                        <p className="text-xs text-zinc-500">
                          Filter Moz data and AI output to keep irrelevant keywords out of your plan.
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={form.useSenseCheck}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            useSenseCheck: !prev.useSenseCheck,
                          }))
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]",
                          form.useSenseCheck
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-zinc-800/40 text-zinc-400"
                        )}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            form.useSenseCheck ? "bg-emerald-300" : "bg-zinc-500"
                          )}
                        />
                        {form.useSenseCheck ? "On" : "Off"}
                      </button>
                    </div>
                  </div>

                  <FieldGroup fieldId="competitors-0" label="Closest competitors">
                    <div className="space-y-3">
                      {form.competitors.map((value, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/10 p-3 md:flex-row md:items-center"
                        >
                          <Input
                            id={`competitors-${index}`}
                            aria-label={`Competitor ${index + 1}`}
                            value={value}
                            onChange={(event) =>
                              setForm((prev) => {
                                const copy = [...prev.competitors];
                                copy[index] = event.target.value;
                                return { ...prev, competitors: copy };
                              })
                            }
                            placeholder="https://competitor.com"
                            className={inputClasses}
                          />
                          {form.competitors.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="ml-auto h-9 w-9 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  competitors: prev.competitors.filter((_, idx) => idx !== index),
                                }))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}

                      {form.competitors.length < MAX_COMPETITORS && (
                        <Button
                          type="button"
                          variant="outline"
                          className="btn-secondary w-full"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              competitors: [...prev.competitors, ""],
                            }))
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add competitor
                        </Button>
                      )}
                    </div>
                  </FieldGroup>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="btn-primary w-full"
                      disabled={
                        isGenerating ||
                        isPrefilling ||
                        !form.businessName.trim() ||
                        !form.website.trim() ||
                        !form.businessType.trim()
                      }
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {generationMessage}
                        </>
                      ) : (
                        <>
                          Generate strategy
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="btn-secondary w-full"
                      onClick={handleReset}
                      disabled={isGenerating || isPrefilling}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>

                    {mozStatus && !mozStatus.hasCredits && (
                      <Alert variant="warning" className="relative border-amber-400/30 bg-amber-500/10">
                        <AlertTriangle className="h-4 w-4 text-amber-300" />
                        <AlertDescription className="text-sm text-amber-100">
                          <strong>Moz API Limited:</strong> {mozStatus.error || "Keyword data and metrics will be unavailable."}
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-xs text-zinc-500">
                      Inputs auto-save to your browser. Reset clears everything.
                    </p>

                    {error && (
                      <Alert variant="destructive" className="relative">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-start justify-between gap-2 text-sm">
                          <span className="flex-1">{error}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setError(null)}
                            className="h-5 w-5 shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </FormSection>
            </form>
            </div>
          </div>
        ) : (
          // STAGE 2: Report Display - Full Width
          <div className="fade-in mx-auto w-full max-w-[1400px] px-6 pb-24 pt-12 md:px-10">
            <HeroHeader mozStatus={mozStatus} />

            <div className="mt-6 mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <ProgressTicker
                  message={generationMessage}
                  isRunning={isGenerating}
                  hasReport={hasReport}
                  keywordScore={keywordScore}
                />
              </div>
              <Button
                onClick={() => setReport(null)}
                variant="ghost"
                className="btn-secondary self-start md:self-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Edit Inputs
              </Button>
            </div>

            <section className="space-y-6">
              <Card className="card-standard overflow-hidden">
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-white">
                        Strategy board
                      </CardTitle>
                      <CardDescription className="max-w-xl text-sm text-zinc-400">
                        Keyword intelligence, architecture, and content drafts engineered for conversion-ready copy.
                      </CardDescription>
                    </div>
                    {hasReport ? <KeywordPulse score={keywordScore} /> : null}
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {isGenerating && !hasReport ? (
                    <LoadingState message={generationMessage} />
                  ) : hasReport ? (
                    <>
                      <Tabs defaultValue="summary" className="space-y-5">
                        <TabsList className="flex w-full flex-wrap justify-start gap-2 rounded-full bg-white/10 p-1 backdrop-blur">
                          <SegmentedTrigger value="summary" label="Summary" />
                          <SegmentedTrigger
                            value="architecture"
                            label="Architecture"
                            badge={report.siteArchitecture?.length}
                          />
                          <SegmentedTrigger
                            value="keywords"
                            label="Keywords"
                            badge={
                              report.keywordOpportunities.strongestKeywords.length +
                              report.keywordOpportunities.quickWins.length +
                              report.keywordOpportunities.contentGaps.length +
                              (report.keywordOpportunities.localityKeywords?.length || 0)
                            }
                          />
                          <SegmentedTrigger
                            value="site"
                            label="Site audit"
                            badge={report.targetSite.pages.filter((p) => p.status === "ok").length}
                          />
                          <SegmentedTrigger
                            value="metadata"
                            label="Metadata"
                            badge={report.metadataPlan.keyPages.length + 1}
                          />
                          {hasContentDrafts ? (
                            <SegmentedTrigger
                              value="content"
                              label="Content"
                              badge={report.contentDrafts?.length ?? 0}
                            />
                          ) : null}
                          {hasRecommendations ? (
                            <SegmentedTrigger
                              value="recommendations"
                              label="Actions"
                              badge={report.recommendations?.length ?? 0}
                            />
                          ) : null}
                          <SegmentedTrigger
                            value="competitors"
                            label="Competitors"
                            badge={report.competitors.length}
                          />
                        </TabsList>
                        <div className="space-y-4">
                          <TabsContent value="summary" className="focus-visible:outline-none">
                            <SummaryView report={report} />
                          </TabsContent>
                          <TabsContent value="architecture" className="focus-visible:outline-none">
                            <ArchitectureView architecture={report.siteArchitecture ?? []} />
                          </TabsContent>
                          <TabsContent value="keywords" className="focus-visible:outline-none">
                            <KeywordView report={report} />
                          </TabsContent>
                          <TabsContent value="site" className="focus-visible:outline-none">
                            <SiteAuditView pages={report.targetSite.pages} />
                          </TabsContent>
                          <TabsContent value="metadata" className="focus-visible:outline-none">
                            <MetadataView
                              report={report}
                              onCopy={handleCopy}
                              copyTarget={copyTarget}
                            />
                          </TabsContent>
                          {hasContentDrafts ? (
                            <TabsContent value="content" className="focus-visible:outline-none">
                              <ContentDraftsView
                                drafts={report.contentDrafts ?? []}
                                onCopy={handleCopy}
                                copyTarget={copyTarget}
                              />
                            </TabsContent>
                          ) : null}
                          {hasRecommendations ? (
                            <TabsContent value="recommendations" className="focus-visible:outline-none">
                              <RecommendationsView recommendations={report.recommendations ?? []} />
                            </TabsContent>
                          ) : null}
                          <TabsContent value="competitors" className="focus-visible:outline-none">
                            <CompetitorView report={report} />
                          </TabsContent>
                        </div>
                      </Tabs>
                    </>
                  ) : (
                    <EmptyState />
                  )}
                </CardContent>
                {hasReport && (
                  <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-white/[0.02] text-xs text-zinc-500">
                    <span>Exports mirror the HTML deliverable for clients.</span>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setIsPreviewOpen(true)}
                        className="btn-secondary"
                        variant="ghost"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        onClick={handleDownloadHtml}
                        className="btn-primary"
                      >
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Export HTML
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </section>
          </div>
        )}

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-[960px] border border-white/10 bg-[#0c0f1c] text-zinc-100">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-white">
                Strategy preview
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400">
                Review the report before exporting or sharing.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-[#050713] p-4">
              {hasReport ? (
                <iframe
                  title="SEO strategy preview"
                  srcDoc={reportHtml}
                  className="h-[65vh] w-full rounded-lg border-0"
                />
              ) : (
                <div className="text-sm text-zinc-400">
                  Generate a strategy to preview the export.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent className="max-w-md border border-white/10 bg-[#0c0f1c] text-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-white">
                Reset everything?
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400">
                This clears the form, cached report, and local storage. This action can’t be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button variant="destructive" onClick={confirmReset} className="btn-primary">
                Reset workspace
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCompetitorWarning} onOpenChange={setShowCompetitorWarning}>
          <DialogContent className="max-w-md border border-amber-400/20 bg-[#161626] text-amber-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-200">
                <AlertCircle className="h-4 w-4" />
                No competitors provided
              </DialogTitle>
              <DialogDescription className="text-sm text-amber-100/80">
                Strategies are sharper when we benchmark against competitors. We recommend adding 3–5 URLs.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button className="btn-primary" onClick={confirmGenerateWithoutCompetitors}>
                Generate without competitors
              </Button>
              <Button
                variant="ghost"
                className="btn-secondary"
                onClick={() => {
                  setShowCompetitorWarning(false);
                  setPendingSubmit(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}
function FieldGroup({
  label,
  children,
  fieldId,
}: {
  label: string;
  children: ReactNode;
  fieldId?: string;
}) {
  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={fieldId}
        className="label-enhanced"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function KeywordPulse({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100">
      <span className="flex h-2.5 w-2.5">
        <span className="inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-indigo-200/70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-300" />
      </span>
      Keyword energy {score}%
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-10 py-24 text-center text-zinc-400">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      <div className="space-y-2">
        <p className="text-base font-medium text-zinc-200">{message}</p>
        <p className="text-sm text-zinc-500">
          We are fetching target pages, dissecting competitor copy, and mapping
          intent clusters.
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-10 py-24 text-center text-zinc-400">
      <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-white/5 text-indigo-300">
        <Sparkles className="h-16 w-16 opacity-90" strokeWidth={1.6} />
      </div>
      <div className="space-y-2">
        <p className="text-base font-medium text-zinc-200">
          Generate a strategy to see the magic.
        </p>
        <p className="text-sm text-zinc-500">
          Plug in your site details and we&apos;ll deliver copy-ready outputs.
        </p>
      </div>
    </div>
  );
}

function HeroHeader({
  mozStatus,
}: {
  mozStatus: { isValid: boolean; hasCredits: boolean; error?: string } | null;
}) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-200">
        <span>SEO</span>
        <span>WIZARD</span>
      </div>

      {mozStatus && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]",
                mozStatus.isValid && mozStatus.hasCredits
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  mozStatus.isValid && mozStatus.hasCredits
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                )}
              />
              <span>
                {mozStatus.isValid && mozStatus.hasCredits ? "MOZ OK" : "MOZ"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {mozStatus.isValid && mozStatus.hasCredits
                ? "Moz API connected and has credits"
                : mozStatus.error || "Moz API unavailable"}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </header>
  );
}

function ProgressTicker({
  message,
  isRunning,
  hasReport,
  keywordScore,
}: {
  message: string;
  isRunning: boolean;
  hasReport: boolean;
  keywordScore: number;
}) {
  const inferredIndex = PROGRESS_MESSAGES.findIndex((msg) => msg === message);
  const activeIndex = isRunning
    ? Math.max(inferredIndex, 0)
    : hasReport
    ? PIPELINE_STEPS.length
    : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_16px_40px_rgba(4,7,19,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          {PIPELINE_STEPS.map((step, index) => {
            const isComplete = activeIndex > index;
            const isActive = activeIndex === index && isRunning;
            return (
              <div key={step.key} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold",
                    isComplete ? "border-emerald-400/50 text-emerald-200" : isActive ? "border-indigo-400/50 text-indigo-200" : "text-zinc-600"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px]",
                    isComplete || isActive ? "text-zinc-200" : "text-zinc-600"
                  )}
                >
                  {step.label}
                </span>
                {index < PIPELINE_STEPS.length - 1 ? (
                  <span className="h-px w-6 bg-white/10" />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          {hasReport ? (
            <div className="flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
              <Sparkles className="h-3.5 w-3.5" />
              Keyword energy {keywordScore}%
            </div>
          ) : isRunning ? (
            <span className="text-xs text-zinc-500">{message}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="card-standard">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="mt-1 text-xs text-zinc-500 leading-relaxed">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function SegmentedTrigger({
  value,
  label,
  badge,
}: {
  value: string;
  label: string;
  badge?: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition data-[state=active]:bg-white/15 data-[state=active]:text-white hover:text-zinc-200 focus-visible:outline-none"
    >
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 ? (
        <span className="ds-badge-count ml-1.5">{Math.min(badge, 99)}</span>
      ) : null}
    </TabsTrigger>
  );
}

function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (!entries.length) {
    return (
      <div className="ds-card">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-white mb-1">Activity timeline</h3>
          <p className="text-xs text-zinc-500">
            Key actions inside your workspace.
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          Actions will appear here after you prefill, generate, or export reports.
        </div>
      </div>
    );
  }

  return (
    <div className="ds-card">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-white mb-1">Activity timeline</h3>
        <p className="text-xs text-zinc-500">
          Monitor data pulls, generation runs, and exports.
        </p>
      </div>
      <div className="space-y-4">
        {entries.slice(0, 8).map((entry) => {
          const toneIcon =
            entry.tone === "success"
              ? CheckCircle2
              : entry.tone === "error"
              ? AlertCircle
              : entry.tone === "warning"
              ? AlertTriangle
              : Clock;
          const toneClass =
            entry.tone === "success"
              ? "text-emerald-200"
              : entry.tone === "error"
              ? "text-rose-300"
              : entry.tone === "warning"
              ? "text-amber-200"
              : "text-indigo-200";
          const Icon = toneIcon;
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/10 p-3"
            >
              <div className={cn("mt-0.5 rounded-full border border-white/10 p-1", toneClass)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-white">{entry.label}</p>
                {entry.description ? (
                  <p className="text-xs text-zinc-400">{entry.description}</p>
                ) : null}
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                  {formatRelativeTime(entry.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SummaryView({ report }: { report: SeoReport }) {
  const headlineKeyword =
    report.keywordOpportunities.strongestKeywords[0]?.keyword ??
    report.input.businessType;
  const metrics = report.targetSite.metrics;
  const locality = report.locality ?? { primaryLocation: undefined, serviceArea: undefined };
  const locationLabel =
    locality.primaryLocation ?? locality.serviceArea ?? "Primary market";

  return (
    <div className="ds-grid ds-grid-3">
      <div className="ds-card lg:col-span-2">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Opportunity Pulse
          </h3>
          <p className="text-sm text-zinc-400">
            Snapshot of the most valuable keyword patterns discovered.
          </p>
        </div>
        <div className="space-y-4 text-sm text-zinc-300">
          <p>
            SERP leaders are leaning heavily into{" "}
            <span className="text-white">{headlineKeyword}</span>. We&apos;ve
            extracted metadata copy, page blueprints, and linking tactics to
            close the gap and outrank with clarity.
          </p>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Top clusters
            </p>
            <div className="flex flex-wrap gap-2">
              {report.keywordOpportunities.strongestKeywords
                .slice(0, 6)
                .map((keyword) => (
                  <span
                    key={keyword.keyword}
                    className="ds-badge ds-badge-info"
                  >
                    {keyword.keyword}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ds-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Next best actions
          </h3>
          <p className="text-sm text-zinc-400">
            Direct instructions to deploy in sprints.
          </p>
        </div>
        <div className="space-y-3 text-sm text-zinc-300">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Priority geography
          </p>
          <p className="text-sm text-zinc-100">
            {locationLabel}
            {locality.serviceArea && locality.primaryLocation
              ? ` · Service reach: ${locality.serviceArea}`
              : ""}
          </p>
          {report.input.googleBusinessProfile ? (
            <p className="text-xs text-indigo-200">
              GBP:&nbsp;
              <a
                href={report.input.googleBusinessProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-indigo-100"
              >
                {report.input.googleBusinessProfile}
              </a>
            </p>
          ) : null}
          {report.input.additionalNotes ? (
            <p className="text-xs text-zinc-500">
              Notes:&nbsp;
              <span className="text-zinc-200">{report.input.additionalNotes}</span>
            </p>
          ) : null}
          <ul className="space-y-2">
            {report.pageBlueprints.optimizationChecklist
              .slice(0, 3)
              .map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-300" />
                  <span>{item}</span>
                </li>
              ))}
          </ul>
          <Separator className="bg-white/10" />
          <div className="text-xs text-zinc-500">
            Formatted HTML export contains full tables and action plans.
          </div>
        </div>
      </div>

      {metrics ? (
        <div className="ds-card lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Authority profile
            </h3>
            <p className="text-sm text-zinc-400">
              Signals pulled from Moz to benchmark strength and risk.
            </p>
          </div>
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthorityMetric
                label="Domain authority"
                value={metrics.domainAuthority !== undefined ? `${metrics.domainAuthority}` : "—"}
              />
              <AuthorityMetric
                label="Page authority"
                value={metrics.pageAuthority !== undefined ? `${metrics.pageAuthority}` : "—"}
              />
              <AuthorityMetric
                label="Linking root domains"
                value={
                  metrics.linkingDomains !== undefined
                    ? metrics.linkingDomains.toLocaleString()
                    : "—"
                }
              />
              <AuthorityMetric
                label="Spam score"
                value={
                  metrics.spamScore !== undefined ? `${metrics.spamScore}%` : "—"
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {report.mozUsage && report.mozUsage.totalRows > 0 && (
        <div className="ds-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Moz API Usage
            </h3>
            <p className="text-sm text-zinc-400">
              Credit consumption breakdown for this strategy generation.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-indigo-200">
                {report.mozUsage.totalRows.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">
                rows consumed
              </div>
            </div>
            <div className="space-y-2">
              {report.mozUsage.breakdown.map((item) => (
                <div
                  key={item.method}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <code className="rounded bg-white/10 px-2 py-1 text-xs font-mono text-zinc-300">
                      {item.method}
                    </code>
                    <span className="text-zinc-500">
                      ×{item.count} {item.count === 1 ? "call" : "calls"}
                    </span>
                  </div>
                  <div className="font-semibold text-white">
                    {item.rows.toLocaleString()} rows
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeywordView({ report }: { report: SeoReport }) {
  const { strongestKeywords, quickWins, contentGaps } =
    report.keywordOpportunities;
  const localityKeywords = report.keywordOpportunities.localityKeywords ?? [];
  const senseCheck = report.senseCheck ?? {
    enabled: true,
    flaggedKeywords: [],
    notes: [],
  };
  const hasSenseCheckNotes = senseCheck.notes.length > 0;
  const hasSenseCheckFlags = senseCheck.flaggedKeywords.length > 0;
  return (
    <div className="ds-grid ds-grid-3">
      <div className="ds-card md:col-span-2 xl:col-span-3">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Sense check status
          </h3>
          <p className="text-sm text-zinc-400">
            {senseCheck.enabled
              ? "Moz-backed heuristics and AI filtered the keyword pool before ranking."
              : "Sense check disabled—showing raw keyword pools without AI filtering."}
          </p>
        </div>
        <div className="space-y-3 text-sm text-zinc-200">
          <span className={senseCheck.enabled ? "ds-badge ds-badge-success" : "ds-badge ds-badge-neutral"}>
            <span
              className={`h-2 w-2 rounded-full ${
                senseCheck.enabled ? "bg-emerald-300" : "bg-zinc-400"
              }`}
            />
            {senseCheck.enabled ? "Active" : "Bypassed"}
          </span>
          {hasSenseCheckFlags ? (
            <div className="space-y-1.5 text-xs">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Filtered out
              </p>
              <ul className="space-y-1 text-zinc-300">
                {senseCheck.flaggedKeywords.map((item) => (
                  <li key={item.keyword}>
                    <span className="font-semibold text-white">{item.keyword}</span>
                    {item.reason ? (
                      <span className="text-zinc-400"> — {item.reason}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {hasSenseCheckNotes ? (
            <div className="space-y-1 text-xs text-zinc-400">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Notes
              </p>
              <ul className="space-y-1">
                {senseCheck.notes.map((note, index) => (
                  <li key={`${note}-${index}`}>• {note}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {!hasSenseCheckFlags && !hasSenseCheckNotes && senseCheck.enabled ? (
            <p className="text-xs text-zinc-400">
              All collected keywords cleared the sense check—no anomalies detected.
            </p>
          ) : null}
        </div>
      </div>
      <div className="ds-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Competitor demand themes
          </h3>
          <p className="text-sm text-zinc-400">
            Highest scoring keywords across competitor content stacks.
          </p>
        </div>
        <div>
          <KeywordTable headline="Keyword" keywords={strongestKeywords} />
        </div>
      </div>

      <div className="ds-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Quick win enhancements
          </h3>
          <p className="text-sm text-zinc-400">
            Already present on your site—refine metadata &amp; internal links.
          </p>
        </div>
        <div>
          <KeywordTable headline="Keyword" keywords={quickWins} />
        </div>
      </div>

      <div className="ds-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Local dominance keywords
          </h3>
          <p className="text-sm text-zinc-400">
            High-value terms combining services with target locations.
          </p>
        </div>
        <div>
          <KeywordTable headline="Keyword" keywords={localityKeywords} />
        </div>
      </div>

      <div className="ds-card md:col-span-2 xl:col-span-3">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Content gap roadmap
          </h3>
          <p className="text-sm text-zinc-400">
            Net-new pages or deep rewrites needed to win the SERP.
          </p>
        </div>
        <div className="space-y-4">
          {contentGaps.map((gap) => (
            <div
              key={gap.keyword}
              className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-zinc-200"
            >
              <p className="text-sm font-semibold text-white">{gap.keyword}</p>
              <p className="text-xs text-zinc-500">{gap.opportunity}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                {gap.volume ? <span>Vol {gap.volume.toLocaleString()}</span> : null}
                {gap.difficulty ? <span>Diff {gap.difficulty}</span> : null}
                {gap.intent ? <span>{gap.intent}</span> : null}
              </div>
              <p className="mt-2 text-xs text-indigo-200">
                {gap.recommendedAction}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KeywordTable({
  keywords,
  headline,
}: {
  keywords: KeywordStat[];
  headline: string;
}) {
  return (
    <ScrollArea className="w-full rounded-lg border border-white/10">
      <div className="min-w-[640px]">
        <table className="ds-table">
        <thead>
          <tr>
            <th>{headline}</th>
            <th>Signal score</th>
            <th>Avg. density</th>
            <th className="col-numeric">Volume (est)</th>
            <th>Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((keyword) => {
            const difficulty = keyword.difficulty ?? 0;
            const difficultyLevel = difficulty > 70 ? 'hard' : difficulty > 40 ? 'medium' : 'easy';

            return (
            <tr key={keyword.keyword}>
              <td className="font-semibold">
                <span className="ds-truncate-1">{keyword.keyword}</span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <span className="w-8 text-right font-mono text-sm">{keyword.score.toFixed(1)}</span>
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${Math.min((keyword.score / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="font-mono text-sm">{keyword.density.toFixed(2)}%</td>
              <td className="font-mono text-sm col-numeric">
                {keyword.volume ? keyword.volume.toLocaleString() : "—"}
              </td>
              <td>
                {keyword.difficulty ? (
                  <span className={difficultyLevel === 'hard' ? 'ds-badge ds-badge-error' : difficultyLevel === 'medium' ? 'ds-badge ds-badge-warning' : 'ds-badge ds-badge-success'}>
                    <span className="font-mono">{difficulty}</span>
                    <span className="text-xs opacity-60">
                      {difficultyLevel === 'hard' ? 'Hard' : difficultyLevel === 'medium' ? 'Medium' : 'Easy'}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
            );
          })}
          {!keywords.length && (
            <tr>
              <td
                colSpan={5}
                className="text-center text-zinc-500"
              >
                No keyword data available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </ScrollArea>
  );
}

function SiteAuditView({ pages }: { pages: PageAnalysis[] }) {
  return (
    <ScrollArea className="max-h-[620px] w-full rounded-lg border border-white/5">
      <div className="min-w-[800px]">
        <table className="ds-table">
        <thead>
          <tr>
            <th>URL</th>
            <th>Word count</th>
            <th className="col-numeric">Reading ease</th>
            <th>Primary H1</th>
            <th>Top keywords</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) =>
            page.status === "ok" ? (
              <tr key={page.url}>
                <td className="text-zinc-200">
                  <div className="ds-truncate-1 max-w-xs font-medium text-white">{page.titleTag}</div>
                  <div className="ds-truncate-1 max-w-xs text-xs text-zinc-500">{page.url}</div>
                </td>
                <td>{page.wordCount}</td>
                <td className="col-numeric">
                  {page.readability?.toFixed(1) ?? "—"}
                </td>
                <td className="text-zinc-200">
                  <span className="ds-truncate-1">{page.h1 || "—"}</span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {page.keywords.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword.keyword}
                        className="ds-badge ds-badge-neutral"
                      >
                        {keyword.keyword}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={page.url}>
                <td className="text-zinc-400" colSpan={5}>
                  <strong className="text-white ds-truncate-1">{page.url}</strong>
                  <div className="text-xs text-red-300">
                    {page.error ?? "Could not crawl this page."}
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      </div>
    </ScrollArea>
  );
}

function ArchitectureView({ architecture }: { architecture: SiteArchitectureEntry[] }) {
  if (!architecture.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 text-sm text-zinc-400">
        Site architecture will appear here once a strategy has been generated.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[620px] rounded-lg border border-white/5">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Title</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Target keywords</th>
          </tr>
        </thead>
        <tbody>
          {architecture.map((entry) => (
            <tr key={entry.slug}>
              <td>
                <code className="text-sm font-mono text-indigo-300 ds-truncate-1">
                  {entry.slug.startsWith("/") ? entry.slug : `/${entry.slug}`}
                </code>
              </td>
              <td className="font-semibold">
                <span className="ds-truncate-1">{entry.title}</span>
              </td>
              <td>
                <span className="ds-truncate-2">{entry.purpose}</span>
              </td>
              <td>
                <span
                  className={
                    entry.status === "create"
                      ? "ds-badge ds-badge-info"
                      : entry.status === "optimise"
                        ? "ds-badge ds-badge-success"
                        : "ds-badge ds-badge-neutral"
                  }
                >
                  {entry.status}
                </span>
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {entry.targetKeywords.map((keyword) => (
                    <span key={keyword} className="ds-badge ds-badge-neutral">
                      {keyword}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}

function MetadataView({
  report,
  onCopy,
  copyTarget,
}: {
  report: SeoReport;
  onCopy: (key: string, value: string) => void;
  copyTarget: string | null;
}) {
  return (
    <div className="ds-grid ds-grid-2">
      <div className="ds-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Homepage refresh
          </h3>
          <p className="text-sm text-zinc-400">
            Inject these immediately for the highest lift.
          </p>
        </div>
        <div className="space-y-4 text-sm text-zinc-200">
          <MetadataRow
            label="Meta title"
            value={report.metadataPlan.homepage.title}
            copyKey="homepage-title"
            onCopy={onCopy}
            copyTarget={copyTarget}
          />
          <MetadataRow
            label="Meta description"
            value={report.metadataPlan.homepage.description}
            copyKey="homepage-description"
            onCopy={onCopy}
            copyTarget={copyTarget}
          />
          <MetadataRow
            label="H1 recommendation"
            value={report.metadataPlan.homepage.h1}
            copyKey="homepage-h1"
            onCopy={onCopy}
            copyTarget={copyTarget}
          />
          <MetadataRow
            label="Hero pitch"
            value={report.metadataPlan.homepage.heroPitch}
            copyKey="homepage-hero"
            onCopy={onCopy}
            copyTarget={copyTarget}
          />
          <MetadataRow
            label="Call to action"
            value={report.metadataPlan.homepage.callToAction}
            copyKey="homepage-cta"
            onCopy={onCopy}
            copyTarget={copyTarget}
          />
        </div>
      </div>

      <div className="ds-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Priority supporting pages
          </h3>
          <p className="text-sm text-zinc-400">
            Optimise these URLs or spin up new variants using the copy below.
          </p>
        </div>
        <div className="space-y-4 text-sm text-zinc-200">
          {report.metadataPlan.keyPages.map((page, index) => (
            <div
              key={`${page.title}-${page.suggestedUrl ?? page.h1}`}
              className="rounded-lg border border-white/10 bg-black/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                {page.suggestedUrl ? (
                  <p className="text-xs text-indigo-200">{page.suggestedUrl}</p>
                ) : (
                  <span className="text-xs text-indigo-200 uppercase tracking-[0.2em]">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                      onClick={() =>
                        onCopy(
                          `keypage-${index}`,
                          `${page.title}\n${page.description}`
                        )
                      }
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copyTarget === `keypage-${index}` ? "Copied" : "Copy"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{page.title}</p>
              <p className="mt-2 text-xs text-zinc-500 ds-truncate-2">{page.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompetitorView({ report }: { report: SeoReport }) {
  if (!report.competitors.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 text-sm text-zinc-400">
        Add competitor URLs to surface direct comparison insights.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[600px] rounded-lg border border-white/5">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Domain</th>
            <th>Meta title</th>
            <th>Meta description</th>
            <th className="col-numeric">Domain authority</th>
            <th className="col-numeric">Spam score</th>
            <th>Keyword focus</th>
          </tr>
        </thead>
        <tbody>
          {report.competitors.map((competitor) => {
            const page = competitor.pages[0];
            if (!page || page.status !== "ok") {
              return (
                <tr key={competitor.domain}>
                  <td className="text-zinc-200">
                    <span className="ds-truncate-1">{competitor.domain}</span>
                  </td>
                  <td className="text-zinc-500" colSpan={5}>
                    {page?.error ?? "Unable to crawl competitor homepage."}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={competitor.domain}>
                <td className="text-zinc-200">
                  <div className="font-semibold text-white mb-1 ds-truncate-1">{competitor.domain}</div>
                  <URLLink url={page.url} className="ds-truncate-1" />
                </td>
                <td>
                  <span className="ds-truncate-2">{page.titleTag}</span>
                </td>
                <td className="text-zinc-200">
                  <span className="ds-truncate-2">{page.metaDescription || "—"}</span>
                </td>
                <td className="col-numeric">
                  {competitor.metrics?.domainAuthority ?? "—"}
                </td>
                <td className="col-numeric">
                  {competitor.metrics?.spamScore !== undefined
                    ? `${competitor.metrics.spamScore}%`
                    : "—"}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {page.keywords.slice(0, 6).map((keyword) => (
                      <span
                        key={keyword.keyword}
                        className="ds-badge ds-badge-neutral"
                      >
                        {keyword.keyword}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollArea>
  );
}

function RecommendationsView({ recommendations }: { recommendations: string[] }) {
  if (!recommendations.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 text-sm text-zinc-400">
        Recommendations will appear once a report has been generated.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-black/40 p-6 text-sm text-zinc-200">
      {recommendations.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-300" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function MetadataRow({
  label,
  value,
  copyKey,
  onCopy,
  copyTarget,
}: {
  label: string;
  value: string;
  copyKey: string;
  onCopy: (key: string, value: string) => void;
  copyTarget: string | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          {label}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
              onClick={() => onCopy(copyKey, value)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copyTarget === copyKey ? "Copied" : "Copy"}
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="mt-1 text-sm text-zinc-100 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ContentDraftsView({
  drafts,
  onCopy,
  copyTarget,
}: {
  drafts: PageContentDraft[];
  onCopy: (key: string, value: string) => void;
  copyTarget: string | null;
}) {
  if (!drafts.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 text-sm text-zinc-400">
        Content drafts will appear here once AI generation completes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {drafts.map((draft, draftIndex) => {
        const copyValue = buildDraftCopy(draft);
        const copyKey = `draft-${draftIndex}-page`;
        return (
          <div
            key={draft.slug ?? draftIndex}
            className="ds-card text-zinc-200"
          >
            <div className="mb-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    {draft.title}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {draft.summary}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="ds-btn ds-btn-secondary ds-btn-sm"
                      onClick={() => onCopy(copyKey, copyValue)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy full page
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copyTarget === copyKey ? "Copied" : "Copy full page"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="ds-badge ds-badge-info">
                  {draft.slug ? `/${draft.slug.replace(/^\//, "")}` : "draft"}
                </span>
                {draft.url ? (
                  <span className="text-xs text-zinc-500">
                    Suggested URL: <code>{draft.url}</code>
                  </span>
                ) : null}
                <span className="text-xs text-zinc-500">
                  CTA: <span className="text-zinc-200">{draft.callToAction}</span>
                </span>
              </div>
            </div>
            <div className="space-y-6">
              {draft.sections.map((section, sectionIndex) => (
                <ContentSectionView
                  key={`${draft.slug ?? draftIndex}-section-${sectionIndex}`}
                  section={section}
                  onCopy={onCopy}
                  copyTarget={copyTarget}
                  copyKey={`draft-${draftIndex}-section-${sectionIndex}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContentSectionView({
  section,
  onCopy,
  copyTarget,
  copyKey,
}: {
  section: PageContentDraft["sections"][number];
  onCopy: (key: string, value: string) => void;
  copyTarget: string | null;
  copyKey: string;
}) {
  const paragraphs = section.body
    .split(/\r?\n\s*/)
    .map((para) => para.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">
            {section.heading}
          </h4>
          <p className="text-xs text-zinc-500">{section.purpose}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
              onClick={() => onCopy(copyKey, section.body)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copyTarget === copyKey ? "Copied" : "Copy section"}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-100">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {section.targetKeywords?.length ? (
          <div className="flex flex-wrap items-center gap-2 text-zinc-400">
            <span className="uppercase tracking-[0.2em]">Targets</span>
            {section.targetKeywords.map((keyword) => (
              <Badge
                key={keyword}
                className="rounded-full bg-purple-500/20 text-purple-200"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        ) : null}
        {section.internalLinks?.length ? (
          <div className="flex flex-wrap items-center gap-2 text-zinc-400">
            <span className="uppercase tracking-[0.2em]">Internal</span>
            {section.internalLinks.map((link) => (
              <code key={link} className="rounded bg-white/10 px-2 py-1 text-xs">
                {link}
              </code>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildDraftCopy(draft: PageContentDraft): string {
  const parts: string[] = [draft.title, draft.summary];
  draft.sections.forEach((section) => {
    parts.push(`${section.heading}\n${section.body}`);
  });
  parts.push(`Call to action: ${draft.callToAction}`);
  return parts.filter(Boolean).join("\n\n");
}

function AuthorityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
