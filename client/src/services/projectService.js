import api from "./api";

// Builds a multipart FormData payload when files are attached (required for
// multer on the backend to parse them); array fields have to be JSON-encoded
// since FormData only carries strings/files, not nested arrays/objects.
function buildProjectFormData(payload) {
  const formData = new FormData();
  const { files, tags, requiredSkills, removedAttachmentIds, ...rest } = payload;

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (tags !== undefined) formData.append("tags", JSON.stringify(tags));
  if (requiredSkills !== undefined) formData.append("requiredSkills", JSON.stringify(requiredSkills));
  if (removedAttachmentIds !== undefined) {
    formData.append("removedAttachmentIds", JSON.stringify(removedAttachmentIds));
  }
  (files || []).forEach((file) => formData.append("attachments", file));

  return formData;
}

export const getProjects = async (params) => {
  const { data } = await api.get("/projects", { params });
  return data;
};

export const getProjectById = async (id) => {
  const { data } = await api.get(`/projects/${id}`);
  return data.data;
};

export const createProject = async (payload) => {
  const hasFiles = payload.files && payload.files.length > 0;
  const body = hasFiles ? buildProjectFormData(payload) : payload;
  const { data } = await api.post("/projects", body);
  return { ...data.data, message: data.message };
};

export const updateProject = async (id, payload) => {
  const hasFiles = payload.files && payload.files.length > 0;
  const hasRemovals = payload.removedAttachmentIds && payload.removedAttachmentIds.length > 0;
  const body = hasFiles || hasRemovals ? buildProjectFormData(payload) : payload;
  const { data } = await api.put(`/projects/${id}`, body);
  return { ...data.data, message: data.message };
};

export const deleteProject = async (id) => {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
};
