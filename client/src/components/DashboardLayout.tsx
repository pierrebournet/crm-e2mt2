import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Building2,
  Wrench,
  PlusCircle,
  Bell,
  FileSpreadsheet,
  Package,
  FileSearch,
  Bot,
  ClipboardList,
  GraduationCap,
  Tag,
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  AppWindow,
  GitBranchPlus,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/" },
  { icon: Building2, label: "Bâtiments", path: "/batiments", external: "https://utbuildings-e9tjvtyy.manus.space" },
  { icon: Wrench, label: "Interventions", path: "/interventions" },
  { icon: PlusCircle, label: "Nouvelle intervention", path: "/interventions/new" },
  { icon: FileSearch, label: "Analyse de devis", path: "/devis" },
  { icon: Bell, label: "Alertes", path: "/alertes" },
  { icon: ClipboardList, label: "Tableau de suivi", path: "/suivi" },
  { icon: Bot, label: "Assistant IA", path: "/assistant" },
  { icon: Package, label: "BPU", path: "/bpu" },
  { icon: GraduationCap, label: "Tutoriels", path: "/tutoriels" },
  { icon: Tag, label: "Nommage", path: "/nommage" },
  { icon: BookOpen, label: "Référentiel Contrat", path: "/referentiel" },
  { icon: ClipboardCheck, label: "Suivi Livrables", path: "/livrables" },
  { icon: AppWindow, label: "Outils Métier", path: "/outils" },
  { icon: GitBranchPlus, label: "Logigramme", path: "/logigramme" },
  { icon: FileSpreadsheet, label: "Export", path: "/export" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#0C1E3C] flex items-center justify-center">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0C1E3C]">CRM E2MT²</h1>
                <p className="text-xs text-muted-foreground">Suivi des Travaux</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm mt-4">
              Connectez-vous pour accéder au tableau de bord de suivi des interventions de maintenance.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-[#0C1E3C] hover:bg-[#162d52] shadow-lg hover:shadow-xl transition-all"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-[#0C1E3C]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-white/10">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-white/70" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-white tracking-tight truncate text-sm">
                    CRM E2MT²
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 mt-2">
            <SidebarMenu className="px-2 py-1 gap-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        if ((item as any).external) {
                          window.open((item as any).external, "_blank", "noopener,noreferrer");
                        } else {
                          setLocation(item.path);
                        }
                      }}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal text-white/70 hover:text-white hover:bg-white/10 ${
                        isActive
                          ? "!bg-white/15 !text-white font-medium"
                          : ""
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${
                          isActive ? "text-[#E05206]" : ""
                        }`}
                      />
                      <span>{item.label}</span>
                      {(item as any).external && (
                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-white/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-white/10 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border border-white/20 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-[#E05206] text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-white/50 truncate mt-1.5">
                      {user?.role === "admin" ? "Administrateur" : "Technicien"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground font-medium">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-6 bg-slate-50/50 min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
