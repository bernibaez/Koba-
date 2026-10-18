import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { XCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';
import type { Empresa, EstadoEmpresa, Perfil, PlanEmpresa, RolDb } from '@/types/database';

import {
  listarEmpresas,
  crearEmpresa,
  actualizarEstadoEmpresa,
  actualizarPlanEmpresa,
  eliminarEmpresa,
  actualizarLimitesEmpresa,
} from '@/services/empresas.service';
import {
  obtenerUsuarios,
  alternarActivoUsuario,
  actualizarPerfil,
  crearUsuario,
  cambiarPasswordUsuario,
} from '@/services/usuarios.service';
import {
  obtenerConfiguracionModulosPlanes,
  guardarConfiguracionModulosPlanes,
  obtenerModulosPersonalizadosUsuario,
  guardarModulosPersonalizadosUsuario,
  ALL_APP_MODULES,
  DEFAULT_PLAN_MODULES,
  PlanLimites,
  obtenerConfiguracionLimitesPlanes,
  guardarConfiguracionLimitesPlanes,
  DEFAULT_PLAN_LIMITES,
  obtenerLimitesEfectivosEmpresa,
  obtenerConsumoLimitesEmpresa,
  establecerPlanSimulado,
} from '@/services/subscriptionModules.service';

import type {
  SuperAdminViewMode,
  SuperAdminTab,
  ConsumosEmpresasMap,
  FormEmpresaState,
  FormUsuarioState,
  FormLimitesEmpresaState,
} from './superadmin/types';

import SuperAdminHeader from './superadmin/SuperAdminHeader';
import TenantListView from './superadmin/TenantListView';
import UserListView from './superadmin/UserListView';
import CreateTenantView from './superadmin/CreateTenantView';
import CreateUserView from './superadmin/CreateUserView';
import EditQuotasView from './superadmin/EditQuotasView';
import EditUserModulesView from './superadmin/EditUserModulesView';
import PlansModulesView from './superadmin/PlansModulesView';
import MultiTenantInfoView from './superadmin/MultiTenantInfoView';
import ResetPasswordModal from './superadmin/ResetPasswordModal';
import SuperAdminCRMView from './superadmin/SuperAdminCRMView';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<SuperAdminViewMode>('dashboard');
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('tenants');

  // Core Data
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [consumosEmpresas, setConsumosEmpresas] = useState<ConsumosEmpresasMap>({});
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchEmpresa, setSearchEmpresa] = useState('');
  const [filterPlan, setFilterPlan] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');

  const [searchUsuario, setSearchUsuario] = useState('');
  const [filterEmpresaUsuario, setFilterEmpresaUsuario] = useState('todos');

  // Subscription Plans Configuration
  const [planModulesConfig, setPlanModulesConfig] = useState<Record<PlanEmpresa, string[]>>(
    obtenerConfiguracionModulosPlanes
  );
  const [planLimitesConfig, setPlanLimitesConfig] = useState<Record<PlanEmpresa, PlanLimites>>(
    obtenerConfiguracionLimitesPlanes
  );
  const [selectedPlanForConfig, setSelectedPlanForConfig] = useState<PlanEmpresa>('pro');
  const [savingPlanModules, setSavingPlanModules] = useState(false);
  const [savingPlanLimites, setSavingPlanLimites] = useState(false);

  // Form State: New Tenant & Admin
  const [formEmpresa, setFormEmpresa] = useState<FormEmpresaState>({
    nombre: '',
    codigo: '',
    razon_social: '',
    rnc: '',
    plan: 'pro',
    telefono: '',
    correo: '',
    direccion: '',
    limite_usuarios: 15,
    limite_sucursales: 3,
    limite_cajas: 5,
    limite_facturas_mes: 2500,
    admin_nombre: '',
    admin_correo: '',
    admin_password: 'admin123',
  });
  const [creatingEmpresa, setCreatingEmpresa] = useState(false);

  // Form State: New User
  const [formUsuario, setFormUsuario] = useState<FormUsuarioState>({
    nombre_completo: '',
    correo: '',
    password: '123456',
    rol: 'admin',
    empresa_id: '',
    es_superadmin: false,
    telefono: '',
  });
  const [creatingUsuario, setCreatingUsuario] = useState(false);

  // Edit Quotas Form State
  const [selectedEmpresaForLimites, setSelectedEmpresaForLimites] = useState<Empresa | null>(null);
  const [formLimitesEmpresa, setFormLimitesEmpresa] = useState<FormLimitesEmpresaState>({
    limite_usuarios: 10,
    limite_sucursales: 3,
    limite_cajas: 2,
    limite_facturas_mes: 500,
    facturasIlimitadas: false,
    usuariosIlimitados: false,
    cajasIlimitadas: false,
  });
  const [savingEmpresaLimites, setSavingEmpresaLimites] = useState(false);

  // Edit User Modules Form State
  const [selectedUserForModules, setSelectedUserForModules] = useState<Perfil | null>(null);
  const [userCustomModulesMode, setUserCustomModulesMode] = useState<'inherit' | 'custom'>('inherit');
  const [customUserModules, setCustomUserModules] = useState<string[]>([]);
  const [savingUserModules, setSavingUserModules] = useState(false);

  // Password Reset Modal State
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [resetPassTarget, setResetPassTarget] = useState<Perfil | null>(null);
  const [newPassInput, setNewPassInput] = useState('123456');
  const [savingResetPass, setSavingResetPass] = useState(false);

  // Fetch data & quota cache
  const actualizarConsumos = async (lista: Empresa[]) => {
    const map: ConsumosEmpresasMap = {};
    await Promise.all(
      lista.map(async (emp) => {
        try {
          map[emp.id] = await obtenerConsumoLimitesEmpresa(emp);
        } catch {
          // noop
        }
      })
    );
    setConsumosEmpresas(map);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listaEmpresas, listaUsuarios] = await Promise.all([
        listarEmpresas(),
        obtenerUsuarios(),
      ]);
      setEmpresas(listaEmpresas);
      setUsuarios(listaUsuarios);
      actualizarConsumos(listaEmpresas);
    } catch {
      toast.error('Error al cargar datos globales de Kob Cloud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stats calculation (Enfocado en salud de la plataforma SaaS y privacidad total de clientes)
  const stats = useMemo(() => {
    const totalEmpresas = empresas.length;
    const activas = empresas.filter((e) => e.estado === 'activo').length;
    const totalUsuarios = usuarios.length;
    const planesCount = {
      free: empresas.filter((e) => e.plan === 'free').length,
      starter: empresas.filter((e) => e.plan === 'starter').length,
      pro: empresas.filter((e) => e.plan === 'pro').length,
      enterprise: empresas.filter((e) => e.plan === 'enterprise').length,
    };
    return { totalEmpresas, activas, totalUsuarios, planesCount };
  }, [empresas, usuarios]);

  // Filtered lists
  const filteredEmpresas = useMemo(() => {
    return empresas.filter((e) => {
      const matchSearch =
        e.nombre.toLowerCase().includes(searchEmpresa.toLowerCase()) ||
        e.codigo.toLowerCase().includes(searchEmpresa.toLowerCase()) ||
        (e.rnc && e.rnc.toLowerCase().includes(searchEmpresa.toLowerCase()));
      const matchPlan = filterPlan === 'todos' || e.plan === filterPlan;
      const matchEstado = filterEstado === 'todos' || e.estado === filterEstado;
      return matchSearch && matchPlan && matchEstado;
    });
  }, [empresas, searchEmpresa, filterPlan, filterEstado]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      const matchSearch =
        u.nombre_completo.toLowerCase().includes(searchUsuario.toLowerCase()) ||
        u.correo.toLowerCase().includes(searchUsuario.toLowerCase());
      const matchEmpresa =
        filterEmpresaUsuario === 'todos' || u.empresa_id === filterEmpresaUsuario;
      return matchSearch && matchEmpresa;
    });
  }, [usuarios, searchUsuario, filterEmpresaUsuario]);

  // Actions for Empresas
  const handleToggleEstadoEmpresa = async (empresa: Empresa) => {
    const nuevoEstado: EstadoEmpresa = empresa.estado === 'activo' ? 'suspendido' : 'activo';
    try {
      await actualizarEstadoEmpresa(empresa.id, nuevoEstado);
      setEmpresas((prev) =>
        prev.map((e) => (e.id === empresa.id ? { ...e, estado: nuevoEstado } : e))
      );
      toast.success(
        `Negocio "${empresa.nombre}" ${nuevoEstado === 'activo' ? 'activado' : 'suspendido'}`
      );
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const handleCambiarPlan = async (empresaId: string, nuevoPlan: PlanEmpresa) => {
    try {
      await actualizarPlanEmpresa(empresaId, nuevoPlan);
      setEmpresas((prev) =>
        prev.map((e) => (e.id === empresaId ? { ...e, plan: nuevoPlan } : e))
      );
      toast.success(`Plan actualizado a ${nuevoPlan.toUpperCase()}`);
    } catch {
      toast.error('Error al actualizar plan');
    }
  };

  const handleEliminarEmpresa = async (empresa: Empresa) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas ELIMINAR permanentemente la empresa "${empresa.nombre}"?\n\nEsta acción borrará de la base de datos:\n• Todos los usuarios y accesos de este cliente\n• Sus inventarios, ventas y sucursales\n\nEsta acción NO se puede deshacer.`
    );
    if (!confirmacion) return;

    try {
      await eliminarEmpresa(empresa.id);
      setEmpresas((prev) => prev.filter((e) => e.id !== empresa.id));
      const usersActualizados = await obtenerUsuarios();
      setUsuarios(usersActualizados);
      toast.success(`Empresa "${empresa.nombre}" eliminada exitosamente`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar la empresa');
    }
  };

  // Actions for Users
  const handleToggleUsuarioActivo = async (perfil: Perfil) => {
    const nuevoActivo = !perfil.activo;
    try {
      await alternarActivoUsuario(perfil.id, nuevoActivo);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === perfil.id ? { ...u, activo: nuevoActivo } : u))
      );
      toast.success(
        `Usuario ${perfil.nombre_completo} ${nuevoActivo ? 'habilitado' : 'deshabilitado'}`
      );
    } catch {
      toast.error('Error al modificar estado del usuario');
    }
  };

  const handleToggleSuperAdmin = async (perfil: Perfil) => {
    const nuevoSuper = !perfil.es_superadmin;
    try {
      await actualizarPerfil(perfil.id, { es_superadmin: nuevoSuper });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === perfil.id ? { ...u, es_superadmin: nuevoSuper } : u))
      );
      toast.success(
        `Permiso SuperAdmin ${nuevoSuper ? 'concedido a' : 'removido de'} ${perfil.nombre_completo}`
      );
    } catch {
      toast.error('Error al actualizar permisos de superadmin');
    }
  };

  // FORM SUBMISSION 1: Crear Empresa + Admin inicial
  const handleCrearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpresa.nombre.trim() || !formEmpresa.codigo.trim()) {
      toast.error('El nombre comercial y el slug son requeridos');
      return;
    }
    if (!formEmpresa.admin_correo.trim() || !formEmpresa.admin_password) {
      toast.error('Ingresa el correo y contraseña del Administrador del negocio');
      return;
    }

    setCreatingEmpresa(true);
    try {
      // 1. Crear empresa
      const nueva = await crearEmpresa({
        nombre: formEmpresa.nombre.trim(),
        codigo: formEmpresa.codigo.trim(),
        razon_social: formEmpresa.razon_social.trim() || undefined,
        rnc: formEmpresa.rnc.trim() || undefined,
        plan: formEmpresa.plan,
        telefono: formEmpresa.telefono.trim() || undefined,
        correo: formEmpresa.correo.trim() || formEmpresa.admin_correo.trim() || undefined,
        direccion: formEmpresa.direccion.trim() || undefined,
        limite_usuarios: formEmpresa.limite_usuarios,
        limite_sucursales: formEmpresa.limite_sucursales,
        limite_cajas: formEmpresa.limite_cajas,
        limite_facturas_mes: formEmpresa.limite_facturas_mes,
      });

      // 2. Crear admin
      try {
        await crearUsuario({
          nombre_completo: formEmpresa.admin_nombre.trim() || `Admin ${nueva.nombre}`,
          correo: formEmpresa.admin_correo.trim().toLowerCase(),
          password: formEmpresa.admin_password,
          rol: 'admin',
          empresa_id: nueva.id,
          es_superadmin: false,
          telefono: formEmpresa.telefono.trim() || null,
        });
      } catch (userErr: any) {
        console.error('Error al crear usuario admin:', userErr);
        toast.error(`Empresa registrada, pero falló la cuenta admin: ${userErr?.message || 'Error'}`);
      }

      setEmpresas((prev) => [nueva, ...prev]);
      actualizarConsumos([nueva, ...empresas]);

      const listaUsers = await obtenerUsuarios();
      setUsuarios(listaUsers);

      setFormEmpresa({
        nombre: '',
        codigo: '',
        razon_social: '',
        rnc: '',
        plan: 'pro',
        telefono: '',
        correo: '',
        direccion: '',
        limite_usuarios: 15,
        limite_sucursales: 3,
        limite_cajas: 5,
        limite_facturas_mes: 2500,
        admin_nombre: '',
        admin_correo: '',
        admin_password: 'admin123',
      });

      toast.success(`¡Negocio "${nueva.nombre}" y Administrador creados con éxito!`);
      setViewMode('dashboard');
      setActiveTab('tenants');
    } catch {
      toast.error('Error al registrar nueva empresa');
    } finally {
      setCreatingEmpresa(false);
    }
  };

  // FORM SUBMISSION 2: Crear Usuario Global
  const handleCrearUsuarioGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuario.nombre_completo.trim() || !formUsuario.correo.trim() || !formUsuario.password) {
      toast.error('Completa los campos requeridos del usuario');
      return;
    }

    const targetEmpresaId =
      formUsuario.empresa_id || empresas[0]?.id || 'a0000000-0000-0000-0000-000000000001';

    setCreatingUsuario(true);
    try {
      await crearUsuario({
        nombre_completo: formUsuario.nombre_completo.trim(),
        correo: formUsuario.correo.trim().toLowerCase(),
        password: formUsuario.password,
        rol: formUsuario.rol,
        empresa_id: targetEmpresaId,
        es_superadmin: formUsuario.es_superadmin,
        telefono: formUsuario.telefono.trim() || null,
      });

      toast.success(`Usuario "${formUsuario.nombre_completo}" creado exitosamente`);
      setFormUsuario({
        nombre_completo: '',
        correo: '',
        password: '123456',
        rol: 'admin',
        empresa_id: '',
        es_superadmin: false,
        telefono: '',
      });

      const actualizados = await obtenerUsuarios();
      setUsuarios(actualizados);
      setViewMode('dashboard');
      setActiveTab('users');
    } catch (e: any) {
      toast.error(e?.message || 'Error al crear usuario');
    } finally {
      setCreatingUsuario(false);
    }
  };

  // FORM SUBMISSION 3: Guardar Cuotas de una Empresa
  const handleOpenEditLimites = (emp: Empresa) => {
    setSelectedEmpresaForLimites(emp);
    const efectivos = obtenerLimitesEfectivosEmpresa(emp);
    setFormLimitesEmpresa({
      limite_usuarios: efectivos.limite_usuarios === -1 ? 50 : efectivos.limite_usuarios,
      limite_sucursales: emp.limite_sucursales || 3,
      limite_cajas: efectivos.limite_cajas === -1 ? 10 : efectivos.limite_cajas,
      limite_facturas_mes: efectivos.limite_facturas_mes === -1 ? 5000 : efectivos.limite_facturas_mes,
      facturasIlimitadas: efectivos.limite_facturas_mes === -1,
      usuariosIlimitados: efectivos.limite_usuarios === -1,
      cajasIlimitadas: efectivos.limite_cajas === -1,
    });
    // REEMPLAZA LA PÁGINA:
    setViewMode('edit_quotas');
  };

  const handleSaveEmpresaLimites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresaForLimites) return;
    setSavingEmpresaLimites(true);
    try {
      const nuevosLimites = {
        limite_usuarios: formLimitesEmpresa.usuariosIlimitados ? -1 : Number(formLimitesEmpresa.limite_usuarios),
        limite_sucursales: Number(formLimitesEmpresa.limite_sucursales),
        limite_cajas: formLimitesEmpresa.cajasIlimitadas ? -1 : Number(formLimitesEmpresa.limite_cajas),
        limite_facturas_mes: formLimitesEmpresa.facturasIlimitadas ? -1 : Number(formLimitesEmpresa.limite_facturas_mes),
      };

      await actualizarLimitesEmpresa(selectedEmpresaForLimites.id, nuevosLimites);

      const actualizadas = empresas.map((emp) =>
        emp.id === selectedEmpresaForLimites.id ? { ...emp, ...nuevosLimites } : emp
      );
      setEmpresas(actualizadas);
      actualizarConsumos(actualizadas);

      toast.success(`Cuotas actualizadas para "${selectedEmpresaForLimites.nombre}"`);
      setSelectedEmpresaForLimites(null);
      setViewMode('dashboard');
      setActiveTab('tenants');
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar cuotas de la empresa');
    } finally {
      setSavingEmpresaLimites(false);
    }
  };

  // FORM SUBMISSION 4: Configurar Módulos de Usuario
  const handleOpenConfigurarModulosUsuario = (usr: Perfil) => {
    setSelectedUserForModules(usr);
    const custom = obtenerModulosPersonalizadosUsuario(usr.id);
    if (custom && Array.isArray(custom)) {
      setUserCustomModulesMode('custom');
      setCustomUserModules(custom);
    } else {
      setUserCustomModulesMode('inherit');
      const emp = empresas.find((e) => e.id === usr.empresa_id);
      const plan = emp?.plan || 'pro';
      setCustomUserModules(planModulesConfig[plan] || DEFAULT_PLAN_MODULES[plan]);
    }
    // REEMPLAZA LA PÁGINA:
    setViewMode('edit_user_modules');
  };

  const handleSaveUserModules = () => {
    if (!selectedUserForModules) return;
    setSavingUserModules(true);
    try {
      if (userCustomModulesMode === 'inherit') {
        guardarModulosPersonalizadosUsuario(selectedUserForModules.id, null);
        toast.success(
          `"${selectedUserForModules.nombre_completo}" ahora hereda los módulos según su plan de suscripción.`
        );
      } else {
        guardarModulosPersonalizadosUsuario(selectedUserForModules.id, customUserModules);
        toast.success(
          `Módulos personalizados (${customUserModules.length}) guardados para "${selectedUserForModules.nombre_completo}".`
        );
      }
      setSelectedUserForModules(null);
      setViewMode('dashboard');
      setActiveTab('users');
    } catch {
      toast.error('Error al guardar módulos del usuario');
    } finally {
      setSavingUserModules(false);
    }
  };

  // Quick Action: Reset Password
  const handleOpenResetPass = (usr: Perfil) => {
    setResetPassTarget(usr);
    setNewPassInput('123456');
    setShowResetPassModal(true);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassTarget || !newPassInput) {
      toast.error('Ingresa una contraseña válida');
      return;
    }
    setSavingResetPass(true);
    try {
      await cambiarPasswordUsuario(
        resetPassTarget.correo,
        newPassInput,
        resetPassTarget.nombre_completo,
        resetPassTarget.rol
      );
      toast.success(
        `Contraseña de "${resetPassTarget.nombre_completo}" actualizada a: ${newPassInput}`
      );
      setShowResetPassModal(false);
      setResetPassTarget(null);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cambiar contraseña');
    } finally {
      setSavingResetPass(false);
    }
  };

  // Handlers for Plan Modules Config
  const handleToggleModuleInPlan = (moduleId: string) => {
    setPlanModulesConfig((prev) => {
      const current = prev[selectedPlanForConfig] || [];
      const updated = current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId];
      return {
        ...prev,
        [selectedPlanForConfig]: updated,
      };
    });
  };

  const handleEnableAllModulesInPlan = () => {
    setPlanModulesConfig((prev) => ({
      ...prev,
      [selectedPlanForConfig]: ALL_APP_MODULES.map((m) => m.id),
    }));
    toast.info(`Todos los módulos seleccionados para ${selectedPlanForConfig.toUpperCase()}`);
  };

  const handleDisableAllModulesInPlan = () => {
    setPlanModulesConfig((prev) => ({
      ...prev,
      [selectedPlanForConfig]: ['dashboard'],
    }));
    toast.info(`Módulos deshabilitados para ${selectedPlanForConfig.toUpperCase()}`);
  };

  const handleResetPlanModulesToDefault = () => {
    setPlanModulesConfig((prev) => ({
      ...prev,
      [selectedPlanForConfig]: [...DEFAULT_PLAN_MODULES[selectedPlanForConfig]],
    }));
    toast.info(`Módulos de ${selectedPlanForConfig.toUpperCase()} restaurados a los recomendados`);
  };

  const handleSavePlanModulesConfig = () => {
    setSavingPlanModules(true);
    try {
      guardarConfiguracionModulosPlanes(planModulesConfig);
      toast.success(
        `Configuración sincronizada en la nube (Supabase) para el plan ${selectedPlanForConfig.toUpperCase()}.`
      );
    } catch {
      toast.error('Error al guardar configuración');
    } finally {
      setSavingPlanModules(false);
    }
  };

  const handleSimulatePlan = (plan: PlanEmpresa) => {
    guardarConfiguracionModulosPlanes(planModulesConfig);
    establecerPlanSimulado(plan);
    toast.success(`Activando simulación: Viendo KOBA con los módulos del Plan ${plan.toUpperCase()}`);
    navigate('/');
  };

  // Handlers for Plan Quotas Config
  const handleSavePlanLimitesConfig = () => {
    setSavingPlanLimites(true);
    try {
      guardarConfiguracionLimitesPlanes(planLimitesConfig);
      toast.success(`Cuotas del plan ${selectedPlanForConfig.toUpperCase()} sincronizadas en la nube (Supabase)`);
      actualizarConsumos(empresas);
    } catch {
      toast.error('Error al guardar cuotas del plan');
    } finally {
      setSavingPlanLimites(false);
    }
  };

  const handleResetPlanLimitesToDefault = () => {
    setPlanLimitesConfig((prev) => ({
      ...prev,
      [selectedPlanForConfig]: { ...DEFAULT_PLAN_LIMITES[selectedPlanForConfig] },
    }));
    toast.info(`Cuotas de ${selectedPlanForConfig.toUpperCase()} restauradas a los valores sugeridos`);
  };

  // Restricción de acceso SuperAdmin
  if (user && !user.isSuperAdmin) {
    return (
      <AppLayout>
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-600">
            <XCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Este módulo es exclusivo para el Super Administrador de Kob Cloud. Tu cuenta pertenece a una empresa cliente y no posee privilegios globales sobre la plataforma.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* ========================================================================= */}
        {/* VISTA 1: REGISTRAR NUEVO NEGOCIO (REEMPLAZA LA PÁGINA)                    */}
        {/* ========================================================================= */}
        {viewMode === 'create_tenant' && (
          <CreateTenantView
            formData={formEmpresa}
            onChange={setFormEmpresa}
            onSubmit={handleCrearEmpresa}
            onCancel={() => setViewMode('dashboard')}
            submitting={creatingEmpresa}
          />
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: CREAR USUARIO (REEMPLAZA LA PÁGINA)                              */}
        {/* ========================================================================= */}
        {viewMode === 'create_user' && (
          <CreateUserView
            formData={formUsuario}
            empresas={empresas}
            onChange={setFormUsuario}
            onSubmit={handleCrearUsuarioGlobal}
            onCancel={() => setViewMode('dashboard')}
            submitting={creatingUsuario}
          />
        )}

        {/* ========================================================================= */}
        {/* VISTA 3: CONFIGURAR CUOTAS DE EMPRESA (REEMPLAZA LA PÁGINA)               */}
        {/* ========================================================================= */}
        {viewMode === 'edit_quotas' && selectedEmpresaForLimites && (
          <EditQuotasView
            empresa={selectedEmpresaForLimites}
            consumo={consumosEmpresas[selectedEmpresaForLimites.id]}
            formData={formLimitesEmpresa}
            onChange={setFormLimitesEmpresa}
            onSubmit={handleSaveEmpresaLimites}
            onCancel={() => {
              setSelectedEmpresaForLimites(null);
              setViewMode('dashboard');
            }}
            submitting={savingEmpresaLimites}
          />
        )}

        {/* ========================================================================= */}
        {/* VISTA 4: CONFIGURAR MÓDULOS DE USUARIO (REEMPLAZA LA PÁGINA)             */}
        {/* ========================================================================= */}
        {viewMode === 'edit_user_modules' && selectedUserForModules && (
          <EditUserModulesView
            user={selectedUserForModules}
            empresa={empresas.find((e) => e.id === selectedUserForModules.empresa_id)}
            mode={userCustomModulesMode}
            onModeChange={setUserCustomModulesMode}
            customModules={customUserModules}
            onToggleModule={(modId) =>
              setCustomUserModules((prev) =>
                prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
              )
            }
            onSetAllModules={(all) =>
              setCustomUserModules(all ? ALL_APP_MODULES.map((m) => m.id) : ['dashboard'])
            }
            onSubmit={handleSaveUserModules}
            onCancel={() => {
              setSelectedUserForModules(null);
              setViewMode('dashboard');
            }}
            submitting={savingUserModules}
          />
        )}

        {/* ========================================================================= */}
        {/* VISTA PRINCIPAL: PANEL SUPER ADMIN DASHBOARD                              */}
        {/* ========================================================================= */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            <SuperAdminHeader
              stats={stats}
              loading={loading}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onRefresh={fetchData}
              onCreateTenant={() => setViewMode('create_tenant')}
              onCreateUser={() => {
                setFormUsuario({
                  nombre_completo: '',
                  correo: '',
                  password: '123456',
                  rol: 'admin',
                  empresa_id: empresas[0]?.id || '',
                  es_superadmin: false,
                  telefono: '',
                });
                setViewMode('create_user');
              }}
            />

            {/* TAB 1: EMPRESAS */}
            {activeTab === 'tenants' && (
              <TenantListView
                empresas={filteredEmpresas}
                consumos={consumosEmpresas}
                search={searchEmpresa}
                onSearchChange={setSearchEmpresa}
                filterPlan={filterPlan}
                onFilterPlanChange={setFilterPlan}
                filterEstado={filterEstado}
                onFilterEstadoChange={setFilterEstado}
                onChangePlan={handleCambiarPlan}
                onToggleEstado={handleToggleEstadoEmpresa}
                onDeleteEmpresa={handleEliminarEmpresa}
                onConfigureQuotas={handleOpenEditLimites}
                onCreateUserForEmpresa={(emp) => {
                  setFormUsuario({
                    nombre_completo: '',
                    correo: '',
                    password: '123456',
                    rol: 'admin',
                    empresa_id: emp.id,
                    es_superadmin: false,
                    telefono: '',
                  });
                  setViewMode('create_user');
                }}
                onCreateTenant={() => setViewMode('create_tenant')}
                onFilterUsersByEmpresa={(empId) => {
                  setFilterEmpresaUsuario(empId);
                  setActiveTab('users');
                }}
              />
            )}

            {/* TAB 2: USUARIOS */}
            {activeTab === 'users' && (
              <UserListView
                usuarios={filteredUsuarios}
                empresas={empresas}
                search={searchUsuario}
                onSearchChange={setSearchUsuario}
                filterEmpresa={filterEmpresaUsuario}
                onFilterEmpresaChange={setFilterEmpresaUsuario}
                onCreateUser={() => {
                  setFormUsuario({
                    nombre_completo: '',
                    correo: '',
                    password: '123456',
                    rol: 'admin',
                    empresa_id: empresas[0]?.id || '',
                    es_superadmin: false,
                    telefono: '',
                  });
                  setViewMode('create_user');
                }}
                onResetPassword={handleOpenResetPass}
                onConfigureModules={handleOpenConfigurarModulosUsuario}
                onToggleSuperAdmin={handleToggleSuperAdmin}
                onToggleActivo={handleToggleUsuarioActivo}
              />
            )}

            {/* TAB 3: PLANES Y MÓDULOS */}
            {activeTab === 'subscriptions' && (
              <PlansModulesView
                planModulesConfig={planModulesConfig}
                planLimitesConfig={planLimitesConfig}
                selectedPlan={selectedPlanForConfig}
                onSelectPlan={setSelectedPlanForConfig}
                onToggleModuleInPlan={handleToggleModuleInPlan}
                onEnableAllModules={handleEnableAllModulesInPlan}
                onDisableAllModules={handleDisableAllModulesInPlan}
                onResetModulesToDefault={handleResetPlanModulesToDefault}
                onSaveModulesConfig={handleSavePlanModulesConfig}
                savingModules={savingPlanModules}
                onUpdatePlanLimites={(limites) =>
                  setPlanLimitesConfig((prev) => ({
                    ...prev,
                    [selectedPlanForConfig]: limites,
                  }))
                }
                onResetLimitesToDefault={handleResetPlanLimitesToDefault}
                onSaveLimitesConfig={handleSavePlanLimitesConfig}
                savingLimites={savingPlanLimites}
                onSimulatePlan={handleSimulatePlan}
              />
            )}

            {/* TAB 4: ARQUITECTURA MULTI-TENANT */}
            {activeTab === 'platform' && <MultiTenantInfoView />}

            {/* TAB 5: CRM & PIPELINE COMERCIAL */}
            {activeTab === 'crm' && <SuperAdminCRMView />}

            {/* MODAL PARA CAMBIO RÁPIDO DE CONTRASEÑA */}
            <ResetPasswordModal
              open={showResetPassModal}
              user={resetPassTarget}
              newPass={newPassInput}
              onPassChange={setNewPassInput}
              onSubmit={handleSaveResetPassword}
              onClose={() => {
                setShowResetPassModal(false);
                setResetPassTarget(null);
              }}
              submitting={savingResetPass}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
