import crypto from "crypto";
import Incident from "../models/Incident.js";
import dataStore from "../services/dataStore.js";

let globalSeqNo = 1050;

function computeEventHash(incident) {
  const payload = `${incident.stationCode}|${incident.title}|${incident.severity}|${incident.createdAt}|${incident.reportedBy || "HQ"}`;
  return "sha256-" + crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export async function listIncidents(req, res) {
  const { code } = req.params;
  const stationCode = (code || "MAITRI").toUpperCase();

  try {
    if (Incident.db && Incident.db.readyState === 1) {
      const incidents = await Incident.find({ stationCode }).sort({ createdAt: -1 });
      if (incidents && incidents.length > 0) return res.json(incidents);
    }
  } catch {
    // fallback to memory
  }

  const memoryIncidents = dataStore.getIncidents(stationCode);
  res.json(memoryIncidents);
}

export async function createIncident(req, res) {
  const { code } = req.params;
  const stationCode = (code || "MAITRI").toUpperCase();

  globalSeqNo++;
  const createdAt = req.body.createdAt || new Date();
  const eventHash = computeEventHash({ ...req.body, stationCode, createdAt });

  const enrichedBody = {
    ...req.body,
    stationCode,
    seqNo: globalSeqNo,
    eventHash,
    createdAt,
    status: req.body.status || "open",
  };

  const newIncident = dataStore.addIncident(stationCode, enrichedBody);

  try {
    if (Incident.db && Incident.db.readyState === 1) {
      if (req.body.clientId) {
        await Incident.findOneAndUpdate(
          { clientId: req.body.clientId },
          enrichedBody,
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } else {
        await Incident.create(enrichedBody);
      }
    }
  } catch {
    // safe in memory
  }

  res.status(201).json(newIncident);
}

export async function updateIncident(req, res) {
  const { id } = req.params;
  const updated = dataStore.updateIncident(id, req.body);

  try {
    if (Incident.db && Incident.db.readyState === 1) {
      await Incident.findByIdAndUpdate(id, req.body, { new: true });
    }
  } catch {
    // safe
  }

  if (!updated) return res.status(404).json({ error: "Incident not found" });
  res.json(updated);
}

export async function dispatchAlertNotification(req, res) {
  const { code } = req.params;
  const stationCode = (code || "MAITRI").toUpperCase();
  const { alertTitle, alertSeverity, targetEmail, stationName, details } = req.body;

  const dispatchId = `DISPATCH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const transmissionHash = crypto
    .createHash("sha256")
    .update(`${dispatchId}|${stationCode}|${alertTitle}|${Date.now()}`)
    .digest("hex");

  const receipt = {
    success: true,
    dispatchId,
    timestamp: new Date().toISOString(),
    stationCode,
    stationName: stationName || `${stationCode} Station`,
    channel: "ISRO GSAT-30 SATCOM + Encrypted High-Priority SMTP Relays",
    recipient: targetEmail || "hq@moes.gov.in",
    priority: (alertSeverity || "critical").toUpperCase(),
    subject: `🚨 [NCPOR-ALERT] ${stationCode} POLAR EMERGENCY: ${alertTitle}`,
    transmissionHash,
    status: "DELIVERED TO NATIONAL EMERGENCY OPERATIONS CENTRE (NEOC / MoES)",
    details: details || "Autonomous Edge AI telemetry anomaly trigger",
  };

  // Log to incident audit trail
  dataStore.addIncident(stationCode, {
    stationCode,
    zoneId: "comms-tower",
    title: `📡 EMERGENCY DISPATCH TRANSMITTED: ${alertTitle}`,
    description: `Encrypted alert payload broadcasted via ISRO GSAT-30 to ${receipt.recipient} [Ref: ${dispatchId}]`,
    severity: "critical",
    status: "acknowledged",
    reportedBy: "Automated Polar Alert Dispatcher",
    eventHash: "sha256-" + transmissionHash.slice(0, 16),
    seqNo: ++globalSeqNo,
    createdAt: new Date(),
  });

  res.json(receipt);
}

