Write-Host "=========================================="
Write-Host "  TEST MULTI-FILTRES - POWER BI DASHBOARD"
Write-Host "=========================================="
$BASE = "http://localhost:3000"

function GetData($url,$label) {
    try { $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { return ($r.Content | ConvertFrom-Json) }
        else { Write-Host "  $label : HTTP $($r.StatusCode)" -ForegroundColor Red; return $null }
    } catch { Write-Host "  $label : ECHEC" -ForegroundColor Red; return $null }
}

# Fetch all data
Write-Host "--- CHARGEMENT ---"
$vRaw = GetData "$BASE/api/vehicles" "vehicles"
$users = GetData "$BASE/users" "users"
$declarations = GetData "$BASE/api/declarations" "declarations"
$iRaw = GetData "$BASE/api/powerbi/stats-interventions" "interventions"
$budget = GetData "$BASE/api/powerbi/budget-analysis" "budget"
$ab = GetData "$BASE/api/budget/active" "active"
$ind = GetData "$BASE/api/powerbi/indicateurs" "indicateurs"
$ai = GetData "$BASE/api/powerbi/v2/ai-insights" "ai-insights"
$doc = GetData "$BASE/api/fleet/kpi/documents-stats" "documents"

$vehicles = if ($vRaw) { $vRaw.vehicles } else { @() }
$interventions = if ($iRaw) { $iRaw.interventions } else { @() }
$chauffeurs = @($users | Where-Object { $_.role -eq "CHAUFFEUR" })
Write-Host "Ok: $($vehicles.Count) veh, $($chauffeurs.Count) chauf, $($declarations.Count) dec, $($interventions.Count) int" -ForegroundColor Green
Write-Host ""

# Pre-compute all global KPIs (before any section-overwrites)
$totalV = $vehicles.Count
$actifV = 0; $bloqueV = 0; $maintV = 0; $kmV = 0
foreach ($v in $vehicles) {
    $s = $v.statut
    if ($s -eq "ACTIF") { $actifV++ }
    elseif ($s -eq "BLOQUE" -or $s -eq "IMMOBILISE") { $bloqueV++ }
    elseif ($s -eq "MAINTENANCE") { $maintV++ }
    $k = [double]($v.kilometrage -as [double])
    if (-not [double]::IsNaN($k)) { $kmV += $k }
}
$totalDec = $declarations.Count
$resoluesDec = 0; $ouvertesDec = 0; $critiquesDec = 0; $coutDec = 0
foreach ($d in $declarations) {
    $s = $d.statut
    if ($s -eq "CLOTURE" -or $s -eq "RESOLU") { $resoluesDec++ }
    elseif ($s -ne "ANNULE" -and $s -ne "REJETEE") { $ouvertesDec++ }
    if ($d.criticite -eq "CRITIQUE" -or $d.criticite -eq "BLOQUANT") { $critiquesDec++ }
    $cc = [double]($d.coutProbleme -as [double])
    if (-not [double]::IsNaN($cc)) { $coutDec += $cc }
}
$tauxResoDec = if ($totalDec -gt 0) { [math]::Round(($resoluesDec / $totalDec) * 100) } else { 0 }
$totalInt = $interventions.Count; $termInt = 0; $encoursInt = 0
foreach ($i in $interventions) {
    $s=$i.statut; if($s -eq "TERMINEE" -or $s -eq "CLOTURE"){$termInt++}
    if($s -eq "EN_COURS" -or $s -eq "OUVERT"){$encoursInt++}
}
$budgetTotal=0; $budgetCout=0
foreach ($b in $budget) {
    $budgetTotal += [double]($b.budget -as [double])
    $budgetCout += [double]($b.cout -as [double])
    if ([double]::IsNaN($budgetTotal)) {$budgetTotal=0}
    if ([double]::IsNaN($budgetCout)) {$budgetCout=0}
}

# === TABLEAU 1: KPIs GLOBAUX (same as pre-computed) ===
Write-Host "=== 1. KPIs GLOBAUX ===" -ForegroundColor Cyan
Write-Host "  Vehicules: Total=$totalV Actif=$actifV Bloque=$bloqueV Maint=$maintV Km=$kmV"
Write-Host "  Declarations: Total=$totalDec Resolues=$resoluesDec Ouvertes=$ouvertesDec Critiques=$critiquesDec TauxReso=${tauxResoDec}% Cout=$([math]::Round($coutDec,2)) DH"
Write-Host "  Interventions: Total=$totalInt Terminees=$termInt EnCours=$encoursInt"
Write-Host "  Budget: Total=$([math]::Round($budgetTotal,2)) Cout=$([math]::Round($budgetCout,2)) DH"
Write-Host ""

# === TABLEAU 2: RÉPARTITION PAR DIMENSION ===
Write-Host "=== 2. DIMENSIONS DE FILTRE ===" -ForegroundColor Cyan

# 2a. Type panne
if ($declarations) {
    Write-Host "  --- Par Type Panne ---"
    $t=@{}
    foreach ($d in $declarations) {
        $k = if ($d.typePanne) {$d.typePanne} else {"?"}
        if ($t.ContainsKey($k)){$t[$k]++}else{$t[$k]=1}
    }
    foreach ($k in ($t.Keys | Sort-Object)) { Write-Host "    $k : $($t[$k])" }
}

# 2b. Criticite
if ($declarations) {
    Write-Host "  --- Par Criticite ---"
    $t=@{}; $c=@{}
    foreach ($d in $declarations) {
        $k = if ($d.criticite) {$d.criticite} else {"?"}
        if ($t.ContainsKey($k)){$t[$k]++}else{$t[$k]=1}
        $v = [double]($d.coutProbleme -as [double]); if ([double]::IsNaN($v)){$v=0}
        if ($c.ContainsKey($k)){$c[$k]+=$v}else{$c[$k]=$v}
    }
    foreach ($k in ($t.Keys | Sort-Object)) { Write-Host "    $k : $($t[$k]) dec, $([math]::Round($c[$k],2)) DH" }
}

# 2c. Statut dec
if ($declarations) {
    Write-Host "  --- Par Statut Declaration ---"
    $t=@{}
    foreach ($d in $declarations) {
        $k = if ($d.statut) {$d.statut} else {"?"}
        if ($t.ContainsKey($k)){$t[$k]++}else{$t[$k]=1}
    }
    foreach ($k in ($t.Keys | Sort-Object)) { Write-Host "    $k : $($t[$k])" }
}

# 2d. Statut vehicule
if ($vehicles) {
    Write-Host "  --- Par Statut Vehicule ---"
    $t=@{}
    foreach ($v in $vehicles) {
        $k = if ($v.statut) {$v.statut} else {"?"}
        if ($t.ContainsKey($k)){$t[$k]++}else{$t[$k]=1}
    }
    foreach ($k in ($t.Keys | Sort-Object)) { Write-Host "    $k : $($t[$k])" }
}

# 2e. Agence
if ($vehicles) {
    Write-Host "  --- Par Agence ---"
    $t=@{}
    foreach ($v in $vehicles) {
        $k = if ($v.agence) {$v.agence} else {"?"}
        if ($t.ContainsKey($k)){$t[$k]++}else{$t[$k]=1}
    }
    foreach ($k in ($t.Keys | Sort-Object)) { Write-Host "    $k : $($t[$k])" }
}

# 2f. Chauffeur
if ($declarations) {
    Write-Host "  --- Par Chauffeur ---"
    $t=@{}; $r=@{}; $ct=@{}
    foreach ($d in $declarations) {
        $k = if ($d.chauffeurNom) {$d.chauffeurNom} else {"?"}
        if ($t.ContainsKey($k)){$t[$k]++}else{$t[$k]=1}
        if ($d.statut -eq "CLOTURE" -or $d.statut -eq "RESOLU") {if ($r.ContainsKey($k)){$r[$k]++}else{$r[$k]=1}}
        $v = [double]($d.coutProbleme -as [double]); if ([double]::IsNaN($v)){$v=0}
        if ($ct.ContainsKey($k)){$ct[$k]+=$v}else{$ct[$k]=$v}
    }
    foreach ($k in ($t.Keys | Sort-Object)) {
        $tot=$t[$k]; $reso=if($r.ContainsKey($k)){$r[$k]}else{0}
        $tx=if($tot-gt0){[math]::Round(($reso/$tot)*100)}else{0}
        Write-Host "    $k : $tot dec ($reso res, ${tx}%) $([math]::Round($ct[$k],2)) DH"
    }
}

# 2g. Par prestataire
if ($interventions) {
    Write-Host "  --- Par Prestataire ---"
    $q=@{}
    foreach ($i in $interventions) {
        $k = if ($i.prestataire) {$i.prestataire} else {"?"}
        if ($q.ContainsKey($k)){$q[$k]++}else{$q[$k]=1}
    }
    foreach ($k in ($q.Keys | Sort-Object)) { Write-Host "    $k : $($q[$k])" }
}

# 2h. Par region
if ($users) {
    Write-Host "  --- Par Region ---"
    $x=@{}
    foreach ($u in $users) {
        $k = if ($u.branchCode) {$u.branchCode} else {"?"}
        if ($x.ContainsKey($k)){$x[$k]++}else{$x[$k]=1}
    }
    foreach ($k in ($x.Keys | Sort-Object)) { Write-Host "    $k : $($x[$k])" }
}
Write-Host ""

# === TABLEAU 3: SCORES CHAUFFEURS ===
Write-Host "=== 3. SCORES CHAUFFEURS (calculés) ===" -ForegroundColor Cyan
if ($chauffeurs) {
    Write-Host ("  {0,-20} {1,6} {2,6} {3,6} {4,6} {5,6} {6,10} {7,8} {8,8} {9,10}" -f "Chauffeur","Decs","Res","Ouv","Crit","Taux%","Cout","Vehic","Int","Score")
    Write-Host ("  " + "-" * 95)
    foreach ($c in $chauffeurs) {
        $nom = "$($c.name) $($c.firstname)"
        $uid = [int]($c.id -as [int])
        $pc = $c.personCode
        $vd = @($vehicles | Where-Object { $_.chauffeurNom -eq $nom })
        $dd = @($declarations | Where-Object {
            $di = $_.chauffeurId; $dn = $_.chauffeurNom; $dm = $_.chauffeurMatricule
            ($di -and $di -eq $uid) -or ($dn -and $dn -eq $nom) -or ($dm -and $dm -eq $pc)
        })
        $id = @($interventions | Where-Object { $_.chauffeurNom -eq $nom })
        $td = $dd.Count; $re = 0; $cr = 0; $ctt = 0
        foreach ($d in $dd) {
            $s=$d.statut; if($s -eq "CLOTURE" -or $s -eq "RESOLU"){$re++}
            if($d.criticite -eq "CRITIQUE" -or $d.criticite -eq "BLOQUANT"){$cr++}
            $v = [double]($d.coutProbleme -as [double]); if (-not [double]::IsNaN($v)){$ctt+=$v}
        }
        $ouv = $td - $re
        $tx = if ($td -gt 0) { [math]::Round(($re/$td)*100) } else { 100 }
        if ($cr -eq 0) {$bonus=20} else {$bonus=[math]::Max(0,20-$cr*5)}
        $sc = [math]::Round(100 * 0.4 + $tx * 0.4 + $bonus)
        Write-Host ("  {0,-20} {1,6} {2,6} {3,6} {4,6} {5,6} {6,10:n0} {7,8} {8,8} {9,10}" -f ($nom.Substring(0,[math]::Min(20,$nom.Length))), $td, $re, $ouv, $cr, $tx, $ctt, $vd.Count, $id.Count, $sc)
    }
}
Write-Host ""

# === TABLEAU 4: VÉHICULES ===
Write-Host "=== 4. VÉHICULES ===" -ForegroundColor Cyan
if ($vehicles) {
    Write-Host ("  {0,-3} {1,-15} {2,-16} {3,8} {4,10} {5,10} {6,12}" -f "Id","Immat","Marque","Km","Statut","Decs","Cout")
    Write-Host ("  " + "-" * 80)
    foreach ($v in $vehicles) {
        $imm = if ($v.immatriculation) {$v.immatriculation} else {"[vide#"+$v.id+"]"}
        $mq = if ($v.marque) {$v.marque} else {"?"}
        $md = if ($v.modele) {$v.modele} else {""}
        $st = if ($v.statut) {$v.statut} else {"?"}
        $km = [double]($v.kilometrage -as [double]); if ([double]::IsNaN($km)){$km=0}
        $nDec=0;$cDec=0
        if ($v.immatriculation) {
            foreach ($d in $declarations) {
                if ($d.vehiculeImmatriculation -and $d.vehiculeImmatriculation -eq $v.immatriculation) {
                    $nDec++
                    $c1 = [double]($d.coutProbleme -as [double]); if (-not [double]::IsNaN($c1)){$cDec+=$c1}
                }
            }
        }
        Write-Host ("  {0,-3} {1,-15} {2,-16} {3,8:n0} {4,10} {5,10} {6,12:n0}" -f $v.id,$imm,("$mq $md").Trim(),$km,$st,$nDec,$cDec)
    }
}
Write-Host ""

# === TABLEAU 5: BUDGET ===
Write-Host "=== 5. BUDGET ===" -ForegroundColor Cyan
if ($budget) {
    Write-Host ("  {0,-10} {1,12} {2,12} {3,12} {4,10}" -f "Mois","Budget","Cout","Ecart","Util%")
    Write-Host ("  " + "-" * 60)
    foreach ($b in ($budget | Sort-Object mois)) {
        $bu = [double]($b.budget -as [double]); if ([double]::IsNaN($bu)){$bu=0}
        $co = [double]($b.cout -as [double]); if ([double]::IsNaN($co)){$co=0}
        $ec = $co - $bu
        $tx=if($bu-gt0){[math]::Round(($co/$bu)*100)}else{0}
        Write-Host ("  {0,-10} {1,12:n0} {2,12:n0} {3,12:n0} {4,9}%" -f $b.mois,$bu,$co,$ec,$tx)
    }
}
Write-Host ""

# === TABLEAU 6: RÉSUMÉ COMPARATIF ===
Write-Host "=== 6. RÉSUMÉ COMPARATIF ===" -ForegroundColor Cyan
$txUtil = if ($totalV -gt 0) {[math]::Round(($actifV/$totalV)*100)}else{0}
Write-Host "  ====== PARC ======"
Write-Host "  Total: $totalV | Actifs: $actifV | Bloqués: $bloqueV | Maintenance: $maintV | Km: $kmV"
Write-Host "  TauxUtilisation: ${txUtil}%"
Write-Host "  ====== DÉCLARATIONS ======"
Write-Host "  Total: $totalDec | Résolues: $resoluesDec | Ouvertes: $ouvertesDec | Critiques: $critiquesDec | TauxReso: ${tauxResoDec}% | Coût: $([math]::Round($coutDec,2)) DH"
Write-Host "  ====== INTERVENTIONS ======"
Write-Host "  Total: $totalInt | Terminées: $termInt | EnCours: $encoursInt"
Write-Host "  ====== BUDGET ======"
Write-Host "  Total: $([math]::Round($budgetTotal,2)) DH | Consommé: $([math]::Round($budgetCout,2)) DH | Restant: $([math]::Round($budgetTotal-$budgetCout,2)) DH"
Write-Host "  ====== CHAUFFEURS ======"
Write-Host "  Total: $($chauffeurs.Count)"
foreach ($c in $chauffeurs) {
    $nom = "$($c.name) $($c.firstname)"; $uid = [int]($c.id -as [int]); $pc=$c.personCode
    $dd = @($declarations | Where-Object {
        $di=$_.chauffeurId;$dn=$_.chauffeurNom;$dm=$_.chauffeurMatricule
        ($di -and $di -eq $uid) -or ($dn -and $dn -eq $nom) -or ($dm -and $dm -eq $pc)
    })
    $td=$dd.Count;$re=0;$cr=0;$ctt=0
    foreach ($d in $dd) {
        $s=$d.statut; if($s -eq "CLOTURE" -or $s -eq "RESOLU"){$re++}
        if($d.criticite -eq "CRITIQUE" -or $d.criticite -eq "BLOQUANT"){$cr++}
        $v = [double]($d.coutProbleme -as [double]); if (-not [double]::IsNaN($v)){$ctt+=$v}
    }
    $tx2=if($td-gt0){[math]::Round(($re/$td)*100)}else{100}
    if ($cr -eq 0) {$bonus2=20} else {$bonus2=[math]::Max(0,20-$cr*5)}
    $sc=[math]::Round(100*0.4+$tx2*0.4+$bonus2)
    Write-Host "    $nom : $td dec, $re res (${tx2}%), $cr crit, $ctt DH, Score=$sc"
}
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  TEST TERMINÉ" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
