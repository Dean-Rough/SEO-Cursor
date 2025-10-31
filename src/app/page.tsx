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
import { logError, logInfo, getUserFriendlyMessage, isRetryableError, ErrorCodes } from "@/lib/error-logger";
import {
  Card,
  CardContent,
  CardDescription,
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
  ArrowRight,
  Copy,
  DownloadCloud,
  Eye,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  Sparkles,
  X,
} from "lucide-react";
import {
  MAX_COMPETITORS_IN_FORM,
  COPY_FEEDBACK_TIMEOUT_MS,
  PROGRESS_MESSAGE_INTERVAL_MS,
  STORAGE_KEY_REPORT,
  STORAGE_KEY_FORM,
} from "@/lib/constants";

const PROGRESS_MESSAGES = [
  "Crawling the target site map…",
  "Profiling competitor intent clusters…",
  "Pulling Moz authority and Mozscape metrics…",
  "Scoring keyword opportunities…",
  "Drafting metadata and content playbooks…",
];

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

const inputClasses =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400";

const textareaClasses =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400";

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
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCompetitorWarning, setShowCompetitorWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  const hasReport = !!report;
  const hasContentDrafts = hasReport && Boolean(report?.contentDrafts?.length);
  const hasRecommendations = hasReport && Boolean(report?.recommendations?.length);
  const reportHtml = useMemo(() => {
    if (!report) return "";
    // Use enhanced report if ANY phase data is present
    const hasEnhancedData = report.intelligence || report.strategy || report.blueprints || report.generatedContent;
    return hasEnhancedData ? generateEnhancedReport(report) : renderReportHtml(report);
  }, [report]);

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
  }, [form.googleBusinessProfile, toast]);

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

  return (
    <TooltipProvider delayDuration={150}>
      <main className="min-h-screen bg-[#080c16] px-6 pb-16 pt-12 text-sm text-zinc-100 md:px-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          <HeroHeader onReset={handleReset} />

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="hidden" />
              <CardContent className="p-6">
                <form className="space-y-6" onSubmit={handleSubmit}>
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
                    placeholder="eg. Gost Glasgow"
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
                    placeholder="https://gost.uk"
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
                    placeholder="Steak restaurant in Glasgow"
                    className={inputClasses}
                  />
                </FieldGroup>

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
                    placeholder="e.g. 12 Miller Street, Edinburgh EH3"
                    className={textareaClasses}
                    rows={2}
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
                    placeholder="Edinburgh, Central Belt, Scotland"
                    className={inputClasses}
                  />
                </FieldGroup>

                <FieldGroup
                  fieldId="google-business-profile"
                  label="Google Business Profile URL or Place ID"
                >
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="google-business-profile"
                        value={form.googleBusinessProfile}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            googleBusinessProfile: event.target.value,
                          }))
                        }
                        placeholder="https://maps.google.com/?cid=..."
                        className={inputClasses}
                        disabled={isPrefilling || isGenerating}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200 hover:bg-white/10"
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
                        <AlertDescription className="flex items-start justify-between gap-2">
                          <span className="flex-1 text-xs">{prefillError}</span>
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
                      <div className="space-y-1">
                        {prefillNotes.map((note, index) => (
                          <p
                            key={`${note}-${index}`}
                            className="text-xs text-zinc-500"
                          >
                            • {note}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </FieldGroup>

                <FieldGroup fieldId="additional-notes" label="Strategic notes">
                  <Textarea
                    id="additional-notes"
                    value={form.additionalNotes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        additionalNotes: event.target.value,
                      }))
                    }
                    placeholder="e.g. Launching a cocktail bar concept alongside existing restaurant portfolio."
                    className={textareaClasses}
                    rows={3}
                  />
                </FieldGroup>

                <FieldGroup fieldId="competitors-0" label="Closest competitors">
                  <div className="space-y-3">
                    {form.competitors.map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
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
                            className="text-zinc-500 hover:text-zinc-200"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                competitors: prev.competitors.filter(
                                  (_, idx) => idx !== index
                                ),
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
                        className="w-full rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
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

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Sense check
                      </p>
                      <p className="text-xs text-zinc-400">
                        Screen Moz data and AI output to remove off-topic or UI copy keywords.
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
                      className={`flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        form.useSenseCheck
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-zinc-800/40 text-zinc-400"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          form.useSenseCheck ? "bg-emerald-300" : "bg-zinc-500"
                        }`}
                      />
                      {form.useSenseCheck ? "On" : "Off"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-indigo-500 text-white hover:bg-indigo-400"
                    disabled={isGenerating || isPrefilling || !form.businessName.trim() || !form.website.trim() || !form.businessType.trim()}
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
                    className="w-full rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                    onClick={handleReset}
                    disabled={isGenerating || isPrefilling}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Inputs auto-save locally; reset clears everything.
                  </p>
                  {error && (
                    <Alert variant="destructive" className="relative">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex items-start justify-between gap-2">
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
              </form>
            </CardContent>
          </Card>

            <Card className="border border-white/10 bg-white/10 backdrop-blur-sm">
              <CardHeader className="flex items-center justify-between px-6 pt-6 pb-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Strategy output
                </CardTitle>
                {hasReport ? <KeywordPulse score={keywordScore} /> : null}
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {isGenerating && !hasReport ? (
                  <LoadingState message={generationMessage} />
                ) : hasReport ? (
                  <>
                    <Tabs defaultValue="summary">
                      <TabsList className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="architecture">
                          Architecture{" "}
                          {report.siteArchitecture?.length ? (
                            <Badge variant="secondary" className="ml-1.5 text-[0.7rem]">
                              {report.siteArchitecture.length}
                            </Badge>
                          ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="keywords">
                          Keywords{" "}
                          <Badge variant="secondary" className="ml-1.5 text-[0.7rem]">
                            {report.keywordOpportunities.strongestKeywords.length +
                              report.keywordOpportunities.quickWins.length +
                              report.keywordOpportunities.contentGaps.length +
                              (report.keywordOpportunities.localityKeywords?.length || 0)}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="site">
                          Site audit{" "}
                          <Badge variant="secondary" className="ml-1.5 text-[0.7rem]">
                            {report.targetSite.pages.filter((p) => p.status === "ok").length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="metadata">
                          Metadata{" "}
                          <Badge variant="secondary" className="ml-1.5 text-[0.7rem]">
                            {report.metadataPlan.keyPages.length + 1}
                          </Badge>
                        </TabsTrigger>
                        {hasContentDrafts ? (
                          <TabsTrigger value="content">
                            Content{" "}
                            <Badge variant="secondary" className="ml-1.5 text-[0.7rem]">
                              {report.contentDrafts?.length ?? 0}
                            </Badge>
                          </TabsTrigger>
                        ) : null}
                        {hasRecommendations ? (
                          <TabsTrigger value="recommendations">
                            Actions{" "}
                            <Badge variant="secondary" className="ml-1.5 text-[0.7rem]">
                              {report.recommendations?.length ?? 0}
                            </Badge>
                          </TabsTrigger>
                        ) : null}
                        <TabsTrigger value="competitors">
                          Competitors{" "}
                          <Badge variant="secondary" className="ml-1.5 text-[0.7rem]">
                            {report.competitors.length}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                      <div className="mt-4 space-y-4">
                        <TabsContent value="summary">
                          <SummaryView report={report} />
                        </TabsContent>
                        <TabsContent value="architecture">
                          <ArchitectureView architecture={report.siteArchitecture ?? []} />
                        </TabsContent>
                        <TabsContent value="keywords">
                          <KeywordView report={report} />
                        </TabsContent>
                        <TabsContent value="site">
                          <SiteAuditView pages={report.targetSite.pages} />
                        </TabsContent>
                        <TabsContent value="metadata">
                          <MetadataView
                            report={report}
                            onCopy={handleCopy}
                            copyTarget={copyTarget}
                          />
                        </TabsContent>
                        {hasContentDrafts ? (
                          <TabsContent value="content">
                            <ContentDraftsView
                              drafts={report.contentDrafts ?? []}
                              onCopy={handleCopy}
                              copyTarget={copyTarget}
                            />
                          </TabsContent>
                        ) : null}
                        {hasRecommendations ? (
                          <TabsContent value="recommendations">
                            <RecommendationsView recommendations={report.recommendations ?? []} />
                          </TabsContent>
                        ) : null}
                        <TabsContent value="competitors">
                          <CompetitorView report={report} />
                        </TabsContent>
                      </div>
                    </Tabs>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                      <span>HTML export mirrors Output.html.</span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setIsPreviewOpen(true)}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-200 hover:bg-white/10"
                          variant="ghost"
                          disabled={!hasReport}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          onClick={handleDownloadHtml}
                          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-zinc-200 hover:bg-white/20"
                          variant="ghost"
                          disabled={!hasReport}
                        >
                          <DownloadCloud className="mr-2 h-4 w-4" />
                          Export HTML
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl border border-white/10 bg-black/90 text-zinc-100">
          <DialogHeader>
            <DialogTitle>HTML Export Preview</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              This mirrors the downloadable Output.html file generated for your strategy.
            </DialogDescription>
          </DialogHeader>
          {hasReport ? (
            <div className="mt-4 h-[60vh] overflow-hidden rounded-xl border border-white/10 bg-black">
              <iframe
                title="SEO strategy preview"
                srcDoc={reportHtml}
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <div className="mt-4 text-sm text-zinc-400">
              Generate a strategy to preview the export.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md border border-white/10 bg-black/90 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Reset Everything?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              This will clear all form data and the generated report. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReset}
            >
              Reset Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompetitorWarning} onOpenChange={setShowCompetitorWarning}>
        <DialogContent className="max-w-md border border-amber-500/20 bg-black/90 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="size-5" />
              No Competitors Provided
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Without competitor analysis, this report will miss critical keyword gaps and
              competitive insights. We recommend adding 3-5 competitor URLs for comprehensive
              SEO strategy.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCompetitorWarning(false);
                setPendingSubmit(null);
              }}
            >
              Add Competitors
            </Button>
            <Button
              variant="default"
              onClick={confirmGenerateWithoutCompetitors}
            >
              Generate Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function HeroHeader({ onReset }: { onReset: () => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-2">
        <h1 className="max-w-2xl truncate text-3xl font-semibold text-white md:text-4xl">
          SEO Wizard
        </h1>
        <p className="text-sm text-zinc-500">
          Personal console for keyword research, content planning, and exports.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
        <span className="rounded-full border border-white/10 px-3 py-1">
          Local cache autosaves
        </span>
        <Button
          variant="outline"
          className="border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200 hover:bg-white/10"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </header>
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
        className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function KeywordPulse({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
      <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
      <span className="font-semibold uppercase tracking-[0.2em]">
        Keyword energy {score}%
      </span>
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

function SummaryView({ report }: { report: SeoReport }) {
  const headlineKeyword =
    report.keywordOpportunities.strongestKeywords[0]?.keyword ??
    report.input.businessType;
  const metrics = report.targetSite.metrics;
  const locality = report.locality ?? { primaryLocation: undefined, serviceArea: undefined };
  const locationLabel =
    locality.primaryLocation ?? locality.serviceArea ?? "Primary market";

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="border border-white/5 bg-white/5 lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white">
            Opportunity Pulse
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Snapshot of the most valuable keyword patterns discovered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
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
                  <Badge
                    key={keyword.keyword}
                    className="rounded-full bg-indigo-500/20 text-indigo-200"
                  >
                    {keyword.keyword}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/5 bg-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white">
            Next best actions
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Direct instructions to deploy in sprints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
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
        </CardContent>
      </Card>

      {metrics ? (
        <Card className="border border-white/5 bg-white/5 lg:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white">
              Authority profile
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Signals pulled from Moz to benchmark strength and risk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </CardContent>
        </Card>
      ) : null}
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
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card className="border border-white/5 bg-white/5 md:col-span-2 xl:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Sense check status
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            {senseCheck.enabled
              ? "Moz-backed heuristics and AI filtered the keyword pool before ranking."
              : "Sense check disabled—showing raw keyword pools without AI filtering."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-200">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                senseCheck.enabled ? "bg-emerald-400" : "bg-zinc-500"
              }`}
            />
            {senseCheck.enabled ? "Active" : "Bypassed"}
          </div>
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
        </CardContent>
      </Card>
      <Card className="border border-white/5 bg-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Competitor demand themes
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Highest scoring keywords across competitor content stacks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordTable headline="Keyword" keywords={strongestKeywords} />
        </CardContent>
      </Card>

      <Card className="border border-white/5 bg-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Quick win enhancements
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Already present on your site—refine metadata &amp; internal links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordTable headline="Keyword" keywords={quickWins} />
        </CardContent>
      </Card>

      <Card className="border border-white/5 bg-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Local dominance keywords
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            High-value terms combining services with target locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordTable headline="Keyword" keywords={localityKeywords} />
        </CardContent>
      </Card>

      <Card className="border border-white/5 bg-white/5 md:col-span-2 xl:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Content gap roadmap
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Net-new pages or deep rewrites needed to win the SERP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
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
        <table className="w-full text-left text-xs text-zinc-300">
        <thead className="bg-black/30 uppercase tracking-[0.2em] text-zinc-500">
          <tr>
            <th className="px-4 py-3">{headline}</th>
            <th className="px-4 py-3">Signal score</th>
            <th className="px-4 py-3">Avg. density</th>
            <th className="px-4 py-3">Volume (est)</th>
            <th className="px-4 py-3">Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((keyword) => (
            <tr
              key={keyword.keyword}
              className="border-t border-white/5 transition hover:bg-white/5"
            >
              <td className="px-4 py-2 text-sm text-white">
                {keyword.keyword}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 text-right">{keyword.score.toFixed(1)}</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-indigo-400 transition-all"
                      style={{ width: `${Math.min((keyword.score / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-2">{keyword.density.toFixed(2)}%</td>
              <td className="px-4 py-2">
                {keyword.volume ? keyword.volume.toLocaleString() : "—"}
              </td>
              <td className="px-4 py-2">
                {keyword.difficulty ? (
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-right">{keyword.difficulty}</span>
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full transition-all ${
                          keyword.difficulty > 70
                            ? "bg-red-400"
                            : keyword.difficulty > 40
                            ? "bg-yellow-400"
                            : "bg-emerald-400"
                        }`}
                        style={{ width: `${keyword.difficulty}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
          {!keywords.length && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-3 text-center text-zinc-500"
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
        <table className="w-full text-left text-xs text-zinc-300">
        <thead className="bg-black/40 uppercase tracking-[0.2em] text-zinc-500">
          <tr>
            <th className="px-4 py-3">URL</th>
            <th className="px-4 py-3">Word count</th>
            <th className="px-4 py-3">Reading ease</th>
            <th className="px-4 py-3">Primary H1</th>
            <th className="px-4 py-3">Top keywords</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) =>
            page.status === "ok" ? (
              <tr
                key={page.url}
                className="border-t border-white/5 transition hover:bg-white/5"
              >
                <td className="px-4 py-3 text-zinc-200">
                  <div className="max-w-xs truncate font-medium text-white">{page.titleTag}</div>
                  <div className="max-w-xs truncate text-xs text-zinc-500">{page.url}</div>
                </td>
                <td className="px-4 py-3">{page.wordCount}</td>
                <td className="px-4 py-3">
                  {page.readability?.toFixed(1) ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-200">{page.h1 || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {page.keywords.slice(0, 5).map((keyword) => (
                      <Badge
                        key={keyword.keyword}
                        className="rounded-full bg-white/10 text-zinc-100"
                      >
                        {keyword.keyword}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={page.url} className="border-t border-white/5">
                <td className="px-4 py-3 text-zinc-400" colSpan={5}>
                  <strong className="text-white">{page.url}</strong>
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
      <table className="min-w-full text-left text-xs text-zinc-300">
        <thead className="bg-black/40 uppercase tracking-[0.2em] text-zinc-500">
          <tr>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Purpose</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Target keywords</th>
          </tr>
        </thead>
        <tbody>
          {architecture.map((entry) => (
            <tr key={entry.slug} className="border-t border-white/5">
              <td className="px-4 py-3 text-zinc-200">
                <code>{entry.slug.startsWith("/") ? entry.slug : `/${entry.slug}`}</code>
              </td>
              <td className="px-4 py-3 text-sm text-white">{entry.title}</td>
              <td className="px-4 py-3 text-xs text-zinc-400">{entry.purpose}</td>
              <td className="px-4 py-3">
                <Badge
                  className={
                    entry.status === "create"
                      ? "bg-purple-500/20 text-purple-200"
                      : entry.status === "optimise"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-zinc-500/20 text-zinc-200"
                  }
                >
                  {entry.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {entry.targetKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      className="rounded-full bg-white/10 text-zinc-100"
                    >
                      {keyword}
                    </Badge>
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="border border-white/5 bg-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white">
            Homepage refresh
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Inject these immediately for the highest lift.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-200">
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
        </CardContent>
      </Card>

      <Card className="border border-white/5 bg-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white">
            Priority supporting pages
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Optimise these URLs or spin up new variants using the copy below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-200">
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
              <p className="mt-2 text-xs text-zinc-500">{page.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
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
      <table className="min-w-full text-left text-xs text-zinc-300">
        <thead className="bg-black/40 uppercase tracking-[0.2em] text-zinc-500">
          <tr>
            <th className="px-4 py-3">Domain</th>
            <th className="px-4 py-3">Meta title</th>
            <th className="px-4 py-3">Meta description</th>
            <th className="px-4 py-3">Domain authority</th>
            <th className="px-4 py-3">Spam score</th>
            <th className="px-4 py-3">Keyword focus</th>
          </tr>
        </thead>
        <tbody>
          {report.competitors.map((competitor) => {
            const page = competitor.pages[0];
            if (!page || page.status !== "ok") {
              return (
                <tr key={competitor.domain} className="border-t border-white/5">
                  <td className="px-4 py-3 text-zinc-200">{competitor.domain}</td>
                  <td className="px-4 py-3 text-zinc-500" colSpan={5}>
                    {page?.error ?? "Unable to crawl competitor homepage."}
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={competitor.domain}
                className="border-t border-white/5 transition hover:bg-white/5"
              >
                <td className="px-4 py-3 text-zinc-200">
                  <div className="font-semibold text-white">{competitor.domain}</div>
                  <div className="text-xs text-zinc-500">{page.url}</div>
                </td>
                <td className="px-4 py-3">{page.titleTag}</td>
                <td className="px-4 py-3 text-zinc-200">
                  {page.metaDescription || "—"}
                </td>
                <td className="px-4 py-3">
                  {competitor.metrics?.domainAuthority ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {competitor.metrics?.spamScore !== undefined
                    ? `${competitor.metrics.spamScore}%`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {page.keywords.slice(0, 6).map((keyword) => (
                      <Badge
                        key={keyword.keyword}
                        className="rounded-full bg-white/10 text-zinc-100"
                      >
                        {keyword.keyword}
                      </Badge>
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
          <Card
            key={draft.slug ?? draftIndex}
            className="border border-white/5 bg-white/5 text-zinc-200"
          >
            <CardHeader className="gap-3 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle className="text-base text-white">
                    {draft.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    {draft.summary}
                  </CardDescription>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border border-white/10 bg-black/30 text-zinc-200 hover:bg-black/50"
                      onClick={() => onCopy(copyKey, copyValue)}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copy full page
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copyTarget === copyKey ? "Copied" : "Copy full page"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Badge className="bg-indigo-500/20 text-indigo-200">
                  {draft.slug ? `/${draft.slug.replace(/^\//, "")}` : "draft"}
                </Badge>
                {draft.url ? (
                  <span className="text-xs text-zinc-500">
                    Suggested URL: <code>{draft.url}</code>
                  </span>
                ) : null}
                <span className="text-xs text-zinc-500">
                  CTA: <span className="text-zinc-200">{draft.callToAction}</span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {draft.sections.map((section, sectionIndex) => (
                <ContentSectionView
                  key={`${draft.slug ?? draftIndex}-section-${sectionIndex}`}
                  section={section}
                  onCopy={onCopy}
                  copyTarget={copyTarget}
                  copyKey={`draft-${draftIndex}-section-${sectionIndex}`}
                />
              ))}
            </CardContent>
          </Card>
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
