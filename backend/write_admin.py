import sys
content = """import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { User } from "../types/incident";
import DashboardLayout from "./ui/DashboardLayout";
import Toast from "./ui/Toast";
import {
  Users, Truck, Plus, Search, Edit3, Trash2, RefreshCw, Shield, ShieldOff,
  XCircle, Link2, Unlink, LogOut, Activity, CheckCircle, XCircle as XIcon,
  ChevronDown, ChevronUp, UserPlus, Gauge, AlertTriangle,
} from "lucide-react";
import { KPICard, GlassCard, SkeletonShimmer, soundManager } from "../lib/premium";

const VEHICLE_API = "http://localhost:8080/api/vehicles";
const USER_API = "http://localhost:8080/users";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" }, { value: "CHAUFFEUR", label: "Chauffeur" },
  { value: "PRESTATAIRE", label: "Prestataire" }, { value: "RS", label: "Responsable Support" },
  { value: "MAINTENANCE", label: "Maintenance" }, { value: "SL", label: "Superviseur Livraison" },
  { value: "RPF", label: "RPF" }, { value: "ASM", label: "ASM" },
  { value: "CPL", label: "Chef Parc Logistic" }, { value: "DRL", label: "Dir. Regional Logistic" },
  { value: "RFL", label: "Responsable Flotte" }, { value: "POWERBI", label: "PowerBI" },
];
"""
with open(r"C:\Users\EmsiC\Desktop\mon-projet-extraction\mon-projet\frontend\src\components\AdminModule.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("OK:" + str(len(content)))
