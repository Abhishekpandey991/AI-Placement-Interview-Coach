const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function startInterview(interviewData) {
  const token = localStorage.getItem("access_token");

  const formData = new FormData();

  formData.append("role", interviewData.role);
  formData.append("interviewType", interviewData.interviewType);
  formData.append("difficulty", interviewData.difficulty);
  formData.append("duration", interviewData.duration);
  if (interviewData.resume) {
    formData.append("resume", interviewData.resume);
  }
  const response = await fetch(`${API_URL}/api/interview/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to start interview");
  }

  return data;
}

export async function evaluateAnswer(answerData) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/interview/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(answerData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to evaluate answer");
  }

  return data;
}

export async function getInterviewResults(interviewId) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(
    `${API_URL}/api/interview/${interviewId}/results`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch interview results");
  }

  return data;
}

export async function getDashboardData() {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}/api/interview/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch dashboard");
  }

  return data;
}

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
}

export async function loginUser(userData) {
  const formData = new URLSearchParams();
  formData.append("username", userData.email);
  formData.append("password", userData.password);
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Login API error:", data);

    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail || "Login failed"),
    );
  }

  localStorage.setItem("access_token", data.access_token);

  return data;
}

export async function analyzeResume(file) {
  const token = localStorage.getItem("access_token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/resume/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  console.log("BACKEND RESPONSE:", data);

  if (!response.ok) {
    throw new Error(data.detail || "Failed to analyze resume.");
  }

  return data.analysis;
}

export async function getResumeHistory() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/resume/history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load resume history.");
  }

  return data;
}

export async function getResumeAnalysisById(id) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/resume/analysis/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load resume analysis.");
  }

  return data;
}

export async function generateFollowUp(data) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/interview/follow-up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      interview_id: data.interview_id,
      question_id: data.question_id,
      candidate_answer: data.candidate_answer,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to generate follow-up question");
  }

  if (!result.question_id || !result.follow_up_question) {
    throw new Error(
      "The backend must return question_id and follow_up_question.",
    );
  }

  return result;
}

export async function getImprovementPlan(interviewId) {
  const cleanId = String(interviewId || "").trim();

  if (!cleanId) {
    throw new Error("Interview ID is missing.");
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in again. No authentication token found.");
  }

  const response = await fetch(
    `${API_URL}/api/interview/improvement-plan/${encodeURIComponent(cleanId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your login session has expired. Please log in again.");
    }

    throw new Error(data.detail || "Failed to load improvement plan.");
  }

  return data;
}

export async function saveImprovementProgress(interviewId, completedTaskIds) {
  const cleanId = String(interviewId || "").trim();

  if (!cleanId) {
    throw new Error("Interview ID is missing.");
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in again. No authentication token found.");
  }

  const response = await fetch(
    `${API_URL}/api/interview/improvement-plan/${encodeURIComponent(cleanId)}/progress`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        completed_task_ids: completedTaskIds,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to save improvement progress.");
  }

  return data;
}

export async function getCompletedInterviewHistory() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in again.");
  }

  const response = await fetch(`${API_URL}/api/interview/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load interview history.");
  }

  return data.interviews || [];
}

export async function getDSAProgress() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/progress/dsa`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load DSA progress");
  }

  return response.json();
}

export async function saveDSAProgress(topic, progress) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_URL}/api/progress/dsa/${encodeURIComponent(topic)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(progress),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to save DSA progress");
  }

  return response.json();
}

export async function getDSAProblems() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/progress/dsa/problems`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load DSA problems");
  }

  return response.json();
}

export async function createDSAProblem(problem) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/progress/dsa/problems`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(problem),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to create DSA problem");
  }

  return response.json();
}

export async function updateDSAProblemStatus(problemId, status) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_URL}/api/progress/dsa/problems/${encodeURIComponent(problemId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update problem status");
  }

  return response.json();
}

export async function updateDSAProblemRevision(problemId, needsRevision) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_URL}/api/progress/dsa/problems/${problemId}/revision`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        needs_revision: needsRevision,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update revision.");
  }

  return data;
}

export async function getSystemDesignProgress() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in to view System Design progress.");
  }

  const response = await fetch(`${API_URL}/api/progress/system-design`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load System Design progress.");
  }

  return data;
}

export async function updateSystemDesignStatus(itemType, itemKey, completed) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in again. Authentication token is missing.");
  }

  const response = await fetch(
    `${API_URL}/api/progress/system-design/${itemType}/${encodeURIComponent(itemKey)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed }),
    },
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.detail || `Progress update failed (${response.status})`,
    );
  }

  return result;
}

export async function sendMentorMessage(messages) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in to use AI Placement Mentor.");
  }

  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || "Unable to get a response from the AI mentor.",
    );
  }

  return data;
}

export async function sendTutorMessage(payload) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/api/tutor/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || "Unable to get a response from the AI Tutor.",
    );
  }

  return data;
}
