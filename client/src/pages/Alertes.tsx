import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ALERT_TYPE_LABELS: Record<string, string> = {
  d1_depassement: "Dépassement délai D1",
  d2_depassement: "Dépassement délai D2",
  c1_creation: "Intervention critique C1",
  retard_preventif: "Retard maintenance préventive",
};

const ALERT_TYPE_COLORS: Record<string, string> = {
  d1_depassement: "bg-red-50 border-red-200 text-red-700",
  d2_depassement: "bg-orange-50 border-orange-200 text-orange-700",
  c1_creation: "bg-red-50 border-red-200 text-red-700",
  retard_preventif: "bg-amber-50 border-amber-200 text-amber-700",
};

const ALERT_TYPE_ICONS: Record<string, any> = {
  d1_depassement: AlertTriangle,
  d2_depassement: AlertTriangle,
  c1_creation: Bell,
  retard_preventif: AlertTriangle,
};

export default function Alertes() {
  const [, setLocation] = useLocation();
  const { data: alertsData, isLoading, refetch } = trpc.alerts.list.useQuery();
  const acknowledgeMutation = trpc.alerts.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Alerte acquittée");
      refetch();
    },
  });

  const unacknowledged = alertsData?.filter((a: any) => !a.acknowledged) ?? [];
  const acknowledged = alertsData?.filter((a: any) => a.acknowledged) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {unacknowledged.length} alerte(s) non acquittée(s)
        </p>
      </div>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6"><div className="h-32 bg-muted rounded" /></CardContent>
        </Card>
      ) : (
        <>
          {/* Active Alerts */}
          {unacknowledged.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Non acquittées</h2>
              {unacknowledged.map((alert: any) => {
                const Icon = ALERT_TYPE_ICONS[alert.type] || AlertTriangle;
                return (
                  <Card key={alert.id} className={`border-l-4 ${alert.type.includes("d1") || alert.type === "c1_creation" ? "border-l-red-500" : "border-l-amber-500"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${ALERT_TYPE_COLORS[alert.type] || "bg-gray-50"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ALERT_TYPE_COLORS[alert.type] || "bg-gray-50"}`}>
                                {ALERT_TYPE_LABELS[alert.type] || alert.type}
                              </span>
                              {alert.reference && (
                                <span className="text-xs font-mono text-muted-foreground">{alert.reference}</span>
                              )}
                            </div>
                            <p className="text-sm mt-1">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.sentAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {alert.interventionId && (
                            <Button variant="outline" size="sm" onClick={() => setLocation(`/interventions/${alert.interventionId}`)}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Voir
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => acknowledgeMutation.mutate({ id: alert.id })} disabled={acknowledgeMutation.isPending}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acquitter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Acknowledged Alerts */}
          {acknowledged.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Acquittées</h2>
              {acknowledged.map((alert: any) => (
                <Card key={alert.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-50">
                          <BellOff className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {ALERT_TYPE_LABELS[alert.type] || alert.type}
                          </span>
                          <p className="text-sm mt-1 text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.sentAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {alertsData?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">Aucune alerte</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Les alertes apparaîtront ici lorsqu'une intervention dépassera les délais contractuels.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
