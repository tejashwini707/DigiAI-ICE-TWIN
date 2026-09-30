import Resource from "../models/Resource.js";
import dataStore from "../services/dataStore.js";

export async function listResources(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();

  try {
    if (Resource.db && Resource.db.readyState === 1) {
      const resources = await Resource.find({ stationCode }).sort({ category: 1 });
      if (resources && resources.length > 0) return res.json(resources);
    }
  } catch {
    // fallback
  }

  res.json(dataStore.getResources(stationCode));
}

export async function updateResource(req, res) {
  const { id } = req.params;
  const updated = dataStore.updateResource(id, req.body);

  try {
    if (Resource.db && Resource.db.readyState === 1) {
      await Resource.findByIdAndUpdate(id, req.body, { new: true });
    }
  } catch {
    // safe
  }

  if (!updated) return res.status(404).json({ error: "Resource not found" });
  res.json(updated);
}

export async function createResource(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();

  const newResource = {
    _id: `res-${Math.random().toString(36).substr(2, 9)}`,
    ...req.body,
    stationCode,
  };

  const list = dataStore.getResources(stationCode);
  list.push(newResource);

  try {
    if (Resource.db && Resource.db.readyState === 1) {
      await Resource.create({ ...req.body, stationCode });
    }
  } catch {
    // safe
  }

  res.status(201).json(newResource);
}
