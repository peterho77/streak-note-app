import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  CheckSquare,
  Flame,
  Copy,
  Check,
  Download,
  Save,
  Trash2,
  Plus,
  RotateCcw,
  Calendar,
  Server,
  Database,
  Settings,
  X,
  Sparkles,
  Award,
  ListChecks,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  FastForward,
  User,
  BookOpen,
  Briefcase,
  Eye,
} from 'lucide-react';

import BulletTextarea from "../components/BulletTextArea.jsx";

// ============================================================================
// 1. TIỆN ÍCH XỬ LÝ NGÀY THÁNG & CHUẨN HÓA DỮ LIỆU
// ============================================================================

/** Lấy chuỗi ngày định dạng YYYY-MM-DD từ đối tượng Date (theo múi giờ local) */
const toISODate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Cộng/trừ số ngày vào chuỗi YYYY-MM-DD */
const addDaysISO = (isoDateStr, days) => {
  const [y, m, d] = isoDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

/** Định dạng YYYY-MM-DD sang DD/MM/YYYY cho giao diện Việt Nam */
const formatDateVN = (isoDateStr) => {
  if (!isoDateStr) return 'Chưa thực hiện';
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return isoDateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/** Xếp loại điểm tư duy logic */
const getLogicGrade = (score) => {
  if (score >= 9) return 'Xuất sắc';
  if (score >= 8) return 'Giỏi';
  if (score >= 6) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Cần kèm cặp thêm';
};

/** Hàm sao chép văn bản an toàn (hỗ trợ cả môi trường iframe) */
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Chuyển sang phương án dự phòng phía dưới
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    return false;
  }
};

// ============================================================================
// 2. HÀM TẠO NỘI DUNG BÁO CÁO THEO MẪU
// ============================================================================

const generateFormattedReport = (templateType, data, reportDate) => {
  const dateStr = formatDateVN(reportDate);

  if (templateType === 'student') {
    const score = Number(data.logic_score) || 0;
    return [
      `📋 BÁO CÁO ĐÁNH GIÁ HỌC VIÊN`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 Ngày đánh giá: ${dateStr}`,
      `👤 Học viên: ${data.student_name?.trim() || '[Chưa nhập tên học viên]'}`,
      `📚 Khóa học: ${data.course_name?.trim() || '[Chưa nhập khóa học]'}`,
      `🧠 Điểm tư duy logic: ${score}/10 (${getLogicGrade(score)})`,
      `🎯 Mức độ tập trung: ${data.focus_level || 'Tốt'}`,
      ``,
      `💬 Nhận xét chi tiết của giáo viên:`,
      `${data.teacher_comments?.trim() || 'Học viên tham gia lớp học đầy đủ và hoàn thành bài tập đúng tiến độ.'}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ].join('\n');
  }

  return [
    `📊 BÁO CÁO CÔNG VIỆC HÀNG NGÀY`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📅 Ngày báo cáo: ${dateStr}`,
    `👤 Người báo cáo: ${data.reporter_name?.trim() || '[Chưa nhập tên]'}`,
    `🚀 Dự án / Nhiệm vụ: ${data.project_name?.trim() || '[Chưa nhập dự án]'}`,
    ``,
    `✅ Công việc đã hoàn thành:`,
    `${data.completed_tasks?.trim() || '- Chưa cập nhật'}`,
    ``,
    `📌 Kế hoạch tiếp theo:`,
    `${data.next_plan?.trim() || '- Chưa cập nhật'}`,
    ``,
    `⚠️ Khó khăn / Ghi chú:`,
    `${data.blockers?.trim() || 'Không có vướng mắc phát sinh.'}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n');
};

// ============================================================================
// 3. DỮ LIỆU MẪU BAN ĐẦU (LOCAL STORAGE)
// ============================================================================

const TODAY_ISO = toISODate();
const YESTERDAY_ISO = addDaysISO(TODAY_ISO, -1);

const INITIAL_REPORTS = [
  {
    id: 101,
    templateType: 'student',
    created_at: TODAY_ISO,
    student_name: 'Nguyễn Minh Khang',
    course_name: 'Lập trình Robotics Spike Prime',
    logic_score: 9,
    focus_level: 'Rất tốt',
    teacher_comments:
      'Con nắm rất vững vòng lặp và cảm biến màu sắc. Hoàn thành thử thách dò đường nhanh nhất lớp và biết chủ động hỗ trợ bạn cùng nhóm.',
  },
  {
    id: 102,
    templateType: 'daily',
    created_at: YESTERDAY_ISO,
    reporter_name: 'Trần Hoàng Nam',
    project_name: 'Hệ thống Quản lý Lớp học STEM',
    completed_tasks:
      '- Hoàn thiện API FastAPI cho module điểm danh & streak\n- Viết tài liệu hướng dẫn tích hợp cho team Frontend',
    next_plan:
      '- Kết nối giao diện React với endpoint /reports/\n- Kiểm thử tự động kịch bản reset streak qua ngày mới',
    blockers: 'Cần cấu hình thêm CORSMiddleware trên server FastAPI.',
  },
];

const INITIAL_TASKS = [
  {
    id: 1,
    task_name: 'Chấm bài tập về nhà lớp Scratch & Python',
    is_completed_today: false,
    current_streak: 5,
    last_completed_date: YESTERDAY_ISO,
  },
  {
    id: 2,
    task_name: 'Chuẩn bị giáo cụ và kiểm tra pin bộ Robotics',
    is_completed_today: true,
    current_streak: 3,
    last_completed_date: TODAY_ISO,
    _prevStreak: 2,
    _prevDate: YESTERDAY_ISO,
  },
  {
    id: 3,
    task_name: 'Học 30 phút tiếng Anh / Luyện đề TOEIC',
    is_completed_today: false,
    current_streak: 12,
    last_completed_date: YESTERDAY_ISO,
  },
  {
    id: 4,
    task_name: 'Gửi báo cáo tiến độ học viên cuối ngày',
    is_completed_today: false,
    current_streak: 0,
    last_completed_date: null,
  },
];

const QUICK_COMMENT_CHIPS = [
  'Tiếp thu kiến thức nhanh, chủ động đặt câu hỏi hay.',
  'Hoàn thành sản phẩm đúng thời gian, có tính sáng tạo cao.',
  'Cần rèn luyện thêm kỹ năng đọc hiểu đề và tự gỡ lỗi (debug).',
  'Tinh thần làm việc nhóm tốt, tích cực phát biểu xây dựng bài.',
];

const FOCUS_LEVELS = ['Rất tốt', 'Tốt', 'Khá', 'Cần cải thiện'];

// ============================================================================
// 4. LỚP HELPER KẾT NỐI API FASTAPI (DỄ DÀNG ĐỌC & TÙY CHỈNH)
// ============================================================================

const createFastApiClient = (baseUrl) => {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  const request = async (endpoint, options = {}) => {
    const response = await fetch(`${cleanBase}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      let detail = `Lỗi HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.detail) detail = errBody.detail;
      } catch {
        // Bỏ qua nếu response không phải JSON
      }
      throw new Error(detail);
    }

    return response.json();
  };

  return {
    /** GET /reports/ - Lấy danh sách báo cáo từ FastAPI */
    getReports: () => request('/reports/', { method: 'GET' }),

    /** POST /reports/ - Lưu báo cáo mới lên FastAPI (khớp schema ReportTemplate) */
    createReport: (reportPayload) =>
      request('/reports/', {
        method: 'POST',
        body: JSON.stringify(reportPayload),
      }),

    /** GET /tasks/ - Lấy danh sách checklist & streak */
    getTasks: () => request('/tasks/', { method: 'GET' }),

    /** POST /tasks/{id}/check - Đánh dấu hoàn thành task hôm nay và tăng streak */
    checkTask: (taskId) =>
      request(`/tasks/${taskId}/check`, {
        method: 'POST',
      }),

    /** (Tùy chọn mở rộng) POST /tasks/ - Thêm task mới nếu backend hỗ trợ */
    createTask: (taskPayload) =>
      request('/tasks/', {
        method: 'POST',
        body: JSON.stringify(taskPayload),
      }),

    /** (Tùy chọn mở rộng) DELETE /tasks/{id} - Xóa task nếu backend hỗ trợ */
    deleteTask: (taskId) =>
      request(`/tasks/${taskId}`, {
        method: 'DELETE',
      }),
  };
};

// ============================================================================
// 5. COMPONENT CHÍNH: APP
// ============================================================================

export default function App() {
  // --- Điều hướng & Cấu hình chế độ API ---
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'checklist'
  const [apiMode, setApiMode] = useState(() => {
    try {
      return localStorage.getItem('wf_api_mode') || 'local';
    } catch {
      return 'local';
    }
  });
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    try {
      return localStorage.getItem('wf_api_url') || 'http://localhost:8000';
    } catch {
      return 'http://localhost:8000';
    }
  });
  const [tempUrlInput, setTempUrlInput] = useState(apiBaseUrl);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Ngày hiện tại (cho phép mô phỏng qua ngày mới ở chế độ Demo) ---
  const [currentDateISO, setCurrentDateISO] = useState(() => {
    try {
      return localStorage.getItem('wf_sim_date') || TODAY_ISO;
    } catch {
      return TODAY_ISO;
    }
  });

  // --- Hệ thống thông báo Toast ---
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  // --- State cho Tab 1: Soạn Báo Cáo ---
  const [selectedTemplate, setSelectedTemplate] = useState('student'); // 'student' | 'daily'
  const [studentForm, setStudentForm] = useState({
    student_name: '',
    course_name: 'Lập trình Scratch Nâng cao',
    logic_score: 8,
    focus_level: 'Tốt',
    teacher_comments: '',
  });
  const [dailyForm, setDailyForm] = useState({
    reporter_name: '',
    project_name: '',
    completed_tasks: '',
    next_plan: '',
    blockers: '',
  });
  const [savedReports, setSavedReports] = useState(() => {
    try {
      const stored = localStorage.getItem('wf_reports_v1');
      return stored ? JSON.parse(stored) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });
  const [copiedId, setCopiedId] = useState(null);
  const [previewModalReport, setPreviewModalReport] = useState(null);
  const [confirmDeleteReportId, setConfirmDeleteReportId] = useState(null);

  // --- State cho Tab 2: Checklist & Streak ---
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem('wf_tasks_v1');
      return stored ? JSON.parse(stored) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });
  const [newTaskName, setNewTaskName] = useState('');
  const [justCheckedTaskId, setJustCheckedTaskId] = useState(null);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState(null);

  // Khởi tạo API client theo baseUrl hiện tại
  const apiClient = useMemo(() => createFastApiClient(apiBaseUrl), [apiBaseUrl]);

  // --- Đồng bộ LocalStorage khi ở chế độ Demo ---
  useEffect(() => {
    try {
      localStorage.setItem('wf_api_mode', apiMode);
      localStorage.setItem('wf_api_url', apiBaseUrl);
      localStorage.setItem('wf_sim_date', currentDateISO);
    } catch {
      // Bỏ qua lỗi quota
    }
  }, [apiMode, apiBaseUrl, currentDateISO]);

  useEffect(() => {
    if (apiMode === 'local') {
      try {
        localStorage.setItem('wf_reports_v1', JSON.stringify(savedReports));
      } catch {
        // Bỏ qua
      }
    }
  }, [savedReports, apiMode]);

  useEffect(() => {
    if (apiMode === 'local') {
      try {
        localStorage.setItem('wf_tasks_v1', JSON.stringify(tasks));
      } catch {
        // Bỏ qua
      }
    }
  }, [tasks, apiMode]);

  // --- Tự động chuẩn hóa trạng thái streak theo ngày hiện tại (chế độ Local) ---
  const reconcileTasksForDate = useCallback((taskList, targetDateISO) => {
    const yesterdayISO = addDaysISO(targetDateISO, -1);
    return taskList.map((task) => {
      if (!task.last_completed_date) {
        return { ...task, is_completed_today: false, current_streak: 0 };
      }
      if (task.last_completed_date === targetDateISO) {
        return { ...task, is_completed_today: true };
      }
      if (task.last_completed_date === yesterdayISO) {
        // Đã làm hôm qua -> giữ nguyên streak, chờ check hôm nay
        return { ...task, is_completed_today: false };
      }
      if (task.last_completed_date < yesterdayISO) {
        // Bỏ lỡ ít nhất 1 ngày -> reset streak về 0
        return { ...task, is_completed_today: false, current_streak: 0 };
      }
      return task;
    });
  }, []);

  // --- Tải dữ liệu từ FastAPI khi chuyển chế độ hoặc nhấn đồng bộ ---
  const syncFromFastApi = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [remoteReports, remoteTasks] = await Promise.all([
        apiClient.getReports(),
        apiClient.getTasks(),
      ]);

      // Chuẩn hóa báo cáo từ FastAPI (ReportTemplate) sang cấu trúc hiển thị
      const normalizedReports = (remoteReports || []).map((r) => ({
        ...r,
        templateType: r.focus_level === 'Báo cáo ngày' ? 'daily' : 'student',
      }));

      setSavedReports(normalizedReports.reverse());
      setTasks(remoteTasks || []);
      addToast(`Đã đồng bộ dữ liệu từ FastAPI (${apiBaseUrl})`, 'success');
    } catch (error) {
      addToast(
        `Không kết nối được FastAPI (${error.message}). Đang giữ dữ liệu hiện tại.`,
        'error'
      );
    } finally {
      setIsSyncing(false);
    }
  }, [apiClient, apiBaseUrl, addToast]);

  useEffect(() => {
    if (apiMode === 'fastapi') {
      syncFromFastApi();
    } else {
      setTasks((prev) => reconcileTasksForDate(prev, currentDateISO));
    }
  }, [apiMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // LOGIC XỬ LÝ TAB 1: SOẠN BÁO CÁO
  // ============================================================================

  const activeFormData = selectedTemplate === 'student' ? studentForm : dailyForm;

  const liveReportText = useMemo(() => {
    return generateFormattedReport(selectedTemplate, activeFormData, currentDateISO);
  }, [selectedTemplate, activeFormData, currentDateISO]);

  const handleCopyText = async (text, identifier = 'preview') => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(identifier);
      addToast('Đã sao chép nội dung báo cáo vào clipboard!', 'success');
      setTimeout(() => {
        setCopiedId((prev) => (prev === identifier ? null : prev));
      }, 2000);
    } else {
      addToast('Không thể tự động sao chép, vui lòng bôi đen văn bản.', 'error');
    }
  };

  const handleExportTxt = () => {
    const blob = new Blob([liveReportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug =
      selectedTemplate === 'student'
        ? (studentForm.student_name || 'hoc-vien').trim().replace(/\s+/g, '-')
        : (dailyForm.project_name || 'cong-viec').trim().replace(/\s+/g, '-');
    link.href = url;
    link.download = `bao-cao-${slug.toLowerCase()}-${currentDateISO}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Đã tải xuống file báo cáo (.txt)', 'success');
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();

    if (selectedTemplate === 'student' && !studentForm.student_name.trim()) {
      addToast('Vui lòng nhập Tên học viên trước khi lưu.', 'error');
      return;
    }
    if (selectedTemplate === 'daily' && !dailyForm.reporter_name.trim()) {
      addToast('Vui lòng nhập Tên người báo cáo trước khi lưu.', 'error');
      return;
    }

    const newId = Date.now();

    if (apiMode === 'fastapi') {
      // Tạo payload tương thích 100% với model ReportTemplate trong Python FastAPI
      const fastApiPayload =
        selectedTemplate === 'student'
          ? {
              id: Math.floor(newId % 1000000),
              student_name: studentForm.student_name.trim(),
              course_name: studentForm.course_name.trim() || 'Chung',
              logic_score: Number(studentForm.logic_score),
              focus_level: studentForm.focus_level,
              teacher_comments:
                studentForm.teacher_comments.trim() || 'Hoàn thành tốt buổi học.',
              created_at: currentDateISO,
            }
          : {
              id: Math.floor(newId % 1000000),
              student_name: `[Daily] ${dailyForm.reporter_name.trim()}`,
              course_name: dailyForm.project_name.trim() || 'Công việc hàng ngày',
              logic_score: 10,
              focus_level: 'Báo cáo ngày',
              teacher_comments: liveReportText,
              created_at: currentDateISO,
            };

      setIsSyncing(true);
      try {
        const created = await apiClient.createReport(fastApiPayload);
        const savedItem = {
          ...created,
          templateType: selectedTemplate,
          ...(selectedTemplate === 'daily' ? dailyForm : {}),
        };
        setSavedReports((prev) => [savedItem, ...prev]);
        addToast('Đã lưu báo cáo thành công lên FastAPI!', 'success');
      } catch (error) {
        addToast(`Lỗi khi gửi POST /reports/: ${error.message}`, 'error');
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Chế độ LocalStorage
    const newReport = {
      id: newId,
      templateType: selectedTemplate,
      created_at: currentDateISO,
      ...(selectedTemplate === 'student' ? { ...studentForm } : { ...dailyForm }),
    };

    setSavedReports((prev) => [newReport, ...prev]);
    addToast('Đã lưu báo cáo vào lịch sử!', 'success');
  };

  const handleDeleteReport = (id) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
    setConfirmDeleteReportId(null);
    addToast('Đã xóa báo cáo khỏi danh sách.', 'info');
  };

  const handleResetForm = () => {
    if (selectedTemplate === 'student') {
      setStudentForm({
        student_name: '',
        course_name: 'Lập trình Scratch Nâng cao',
        logic_score: 8,
        focus_level: 'Tốt',
        teacher_comments: '',
      });
    } else {
      setDailyForm({
        reporter_name: '',
        project_name: '',
        completed_tasks: '',
        next_plan: '',
        blockers: '',
      });
    }
    addToast('Đã làm mới biểu mẫu.', 'info');
  };

  // ============================================================================
  // LOGIC XỬ LÝ TAB 2: CHECKLIST & STREAK
  // ============================================================================

  const handleAddTask = async (e) => {
    e.preventDefault();
    const trimmed = newTaskName.trim();
    if (!trimmed) {
      addToast('Vui lòng nhập tên công việc cần theo dõi.', 'error');
      return;
    }

    const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => Number(t.id) || 0)) + 1 : 1;
    const newTask = {
      id: nextId,
      task_name: trimmed,
      is_completed_today: false,
      current_streak: 0,
      last_completed_date: null,
    };

    if (apiMode === 'fastapi') {
      try {
        await apiClient.createTask(newTask);
        await syncFromFastApi();
        setNewTaskName('');
        addToast('Đã thêm task mới lên FastAPI!', 'success');
      } catch {
        // Backend mẫu cơ bản chưa có POST /tasks/ -> thêm vào UI kèm hướng dẫn
        setTasks((prev) => [newTask, ...prev]);
        setNewTaskName('');
        addToast(
          'Đã thêm tạm trên giao diện (bạn hãy bổ sung endpoint POST /tasks/ ở FastAPI để lưu server).',
          'info'
        );
      }
      return;
    }

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskName('');
    addToast('Đã thêm công việc mới vào checklist!', 'success');
  };

  const handleCheckTask = async (task) => {
    if (task.is_completed_today || task.last_completed_date === currentDateISO) {
      addToast('Công việc này đã được hoàn thành trong hôm nay rồi!', 'info');
      return;
    }

    if (apiMode === 'fastapi') {
      setIsSyncing(true);
      try {
        const res = await apiClient.checkTask(task.id);
        const updatedStreak = res?.current_streak ?? task.current_streak + 1;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  is_completed_today: true,
                  current_streak: updatedStreak,
                  last_completed_date: currentDateISO,
                }
              : t
          )
        );
        setJustCheckedTaskId(task.id);
        setTimeout(() => setJustCheckedTaskId(null), 1200);
        addToast(`Tuyệt vời! Chuỗi streak đạt ${updatedStreak} ngày 🔥`, 'streak');
      } catch (error) {
        addToast(`Lỗi gọi POST /tasks/${task.id}/check: ${error.message}`, 'error');
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Logic tính streak chính xác giống Backend Python FastAPI
    const yesterdayISO = addDaysISO(currentDateISO, -1);
    const nextStreak =
      task.last_completed_date === yesterdayISO ? task.current_streak + 1 : 1;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              _prevStreak: t.current_streak,
              _prevDate: t.last_completed_date,
              current_streak: nextStreak,
              last_completed_date: currentDateISO,
              is_completed_today: true,
            }
          : t
      )
    );

    setJustCheckedTaskId(task.id);
    setTimeout(() => setJustCheckedTaskId(null), 1200);
    addToast(`Hoàn thành! Streak "${task.task_name}" tăng lên ${nextStreak} ngày 🔥`, 'streak');
  };

  const handleUndoTaskLocal = (task) => {
    if (apiMode !== 'local' || !task.is_completed_today) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== task.id) return t;
        const restoredStreak =
          typeof t._prevStreak === 'number'
            ? t._prevStreak
            : Math.max(0, t.current_streak - 1);
        const restoredDate =
          t._prevDate !== undefined
            ? t._prevDate
            : restoredStreak > 0
            ? addDaysISO(currentDateISO, -1)
            : null;
        return {
          ...t,
          is_completed_today: false,
          current_streak: restoredStreak,
          last_completed_date: restoredDate,
        };
      })
    );
    addToast('Đã hoàn tác đánh dấu hoàn thành hôm nay.', 'info');
  };

  const handleDeleteTask = async (taskId) => {
    if (apiMode === 'fastapi') {
      try {
        await apiClient.deleteTask(taskId);
      } catch {
        // Vẫn xóa khỏi giao diện nếu backend chưa định nghĩa DELETE /tasks/{id}
      }
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setConfirmDeleteTaskId(null);
    addToast('Đã xóa công việc khỏi checklist.', 'info');
  };

  /** Mô phỏng qua ngày mới (chỉ ở chế độ Demo Local) để kiểm thử tăng/reset streak */
  const handleSimulateNextDay = () => {
    const nextDayISO = addDaysISO(currentDateISO, 1);
    setCurrentDateISO(nextDayISO);
    setTasks((prev) => reconcileTasksForDate(prev, nextDayISO));
    addToast(
      `Đã chuyển sang ngày mới (${formatDateVN(nextDayISO)}). Các task bỏ lỡ hôm qua sẽ tự reset streak về 0!`,
      'info'
    );
  };

  const handleResetRealDate = () => {
    setCurrentDateISO(TODAY_ISO);
    setTasks((prev) => reconcileTasksForDate(prev, TODAY_ISO));
    addToast(`Đã đưa ngày hệ thống về hôm nay (${formatDateVN(TODAY_ISO)}).`, 'info');
  };

  // --- Thống kê tổng quan cho Checklist ---
  const checklistStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.is_completed_today).length;
    const maxStreak = tasks.reduce((max, t) => Math.max(max, t.current_streak || 0), 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, maxStreak, percent };
  }, [tasks]);

  // --- Lưu cài đặt API URL ---
  const handleSaveApiSettings = (e) => {
    e.preventDefault();
    const cleaned = tempUrlInput.trim() || 'http://localhost:8000';
    setApiBaseUrl(cleaned);
    setIsSettingsOpen(false);
    addToast(`Đã cập nhật địa chỉ FastAPI: ${cleaned}`, 'success');
    if (apiMode === 'fastapi') {
      setTimeout(() => syncFromFastApi(), 100);
    }
  };

  // ============================================================================
  // 6. GIAO DIỆN NGƯỜI DÙNG (JSX)
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
            {/* Logo & Tên ứng dụng */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                    WorkFlow & Streak
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Soạn báo cáo nhanh & Theo dõi thói quen
                  </p>
                </div>
              </div>

              {/* Nút cài đặt nhanh trên mobile */}
              <button
                type="button"
                onClick={() => {
                  setTempUrlInput(apiBaseUrl);
                  setIsSettingsOpen(true);
                }}
                className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Cài đặt kết nối API"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Hai Tab chính */}
            <nav
              className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 self-stretch md:self-auto"
              aria-label="Điều hướng chính"
            >
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'reports'
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Soạn Báo Cáo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'checklist'
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Checklist & Streak</span>
                {checklistStats.maxStreak > 0 && (
                  <span className="ml-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600">
                    <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                    {checklistStats.maxStreak}
                  </span>
                )}
              </button>
            </nav>

            {/* Bộ chuyển đổi chế độ API (Demo Local vs FastAPI) */}
            <div className="flex items-center justify-between md:justify-end gap-2">
              <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200/80 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setApiMode('local');
                    addToast('Đang chạy chế độ Demo (Lưu tại LocalStorage)', 'info');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
                    apiMode === 'local'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Demo (Local)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApiMode('fastapi')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
                    apiMode === 'fastapi'
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>FastAPI</span>
                </button>
              </div>

              {apiMode === 'fastapi' && (
                <button
                  type="button"
                  onClick={syncFromFastApi}
                  disabled={isSyncing}
                  className="p-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  title="Đồng bộ lại dữ liệu từ FastAPI"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setTempUrlInput(apiBaseUrl);
                  setIsSettingsOpen(true);
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
                title="Cấu hình địa chỉ máy chủ FastAPI"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="max-w-[115px] truncate">{apiBaseUrl.replace(/^https?:\/\//, '')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== NỘI DUNG CHÍNH ==================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Thanh trạng thái ngày giả lập (nếu người dùng đã bấm qua ngày mới ở Demo mode) */}
        {apiMode === 'local' && currentDateISO !== TODAY_ISO && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Đang ở chế độ mô phỏng ngày: <strong>{formatDateVN(currentDateISO)}</strong>{' '}
                <span className="text-amber-700">(Ngày thực tế: {formatDateVN(TODAY_ISO)})</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetRealDate}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 transition-colors"
            >
              Về ngày hôm nay
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: SOẠN BÁO CÁO THEO MẪU                                      */}
        {/* ================================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Khu vực 2 cột: Form nhập liệu (Trái) & Xem trước trực tiếp (Phải) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI: CHỌN MẪU & FORM NHẬP LIỆU */}
              <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Soạn báo cáo theo mẫu có sẵn
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chọn mẫu bên dưới và điền thông tin, bản xem trước sẽ tự động định dạng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Làm mới
                  </button>
                </div>

                {/* Bộ chọn 2 mẫu báo cáo */}
                <div className="p-5 pb-0">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Chọn mẫu báo cáo
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate('student')}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                        selectedTemplate === 'student'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          selectedTemplate === 'student'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Đánh giá học viên
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          STEM / Robotics / Lập trình
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTemplate('daily')}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                        selectedTemplate === 'daily'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          selectedTemplate === 'daily'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Báo cáo công việc ngày
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Tiến độ, kế hoạch & vướng mắc
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Form chi tiết theo mẫu */}
                <form onSubmit={handleSaveReport} className="p-5 space-y-5">
                  {selectedTemplate === 'student' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Tên học viên <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={studentForm.student_name}
                              onChange={(e) =>
                                setStudentForm({ ...studentForm, student_name: e.target.value })
                              }
                              placeholder="VD: Nguyễn Gia Bảo"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Khóa học
                          </label>
                          <input
                            type="text"
                            list="course-suggestions"
                            value={studentForm.course_name}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, course_name: e.target.value })
                            }
                            placeholder="VD: Scratch, Robotics, Python..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                          <datalist id="course-suggestions">
                            <option value="Lập trình Scratch Nâng cao" />
                            <option value="Lập trình Robotics Spike Prime" />
                            <option value="Python Cơ bản cho Thiếu niên" />
                            <option value="Thiết kế Game Roblox Studio" />
                          </datalist>
                        </div>
                      </div>

                      {/* Thanh trượt Điểm tư duy logic (1-10) */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Điểm tư duy logic (1 - 10)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              {getLogicGrade(studentForm.logic_score)}
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={studentForm.logic_score}
                              onChange={(e) => {
                                const val = Math.min(10, Math.max(1, Number(e.target.value) || 1));
                                setStudentForm({ ...studentForm, logic_score: val });
                              }}
                              className="w-14 text-center font-bold text-indigo-700 py-1 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          step={1}
                          value={studentForm.logic_score}
                          onChange={(e) =>
                            setStudentForm({
                              ...studentForm,
                              logic_score: Number(e.target.value),
                            })
                          }
                          className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1 px-0.5">
                          <span>1 (Yếu)</span>
                          <span>5 (Trung bình)</span>
                          <span>8 (Giỏi)</span>
                          <span>10 (Xuất sắc)</span>
                        </div>
                      </div>

                      {/* Mức độ tập trung */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Mức độ tập trung
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {FOCUS_LEVELS.map((level) => {
                            const active = studentForm.focus_level === level;
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() =>
                                  setStudentForm({ ...studentForm, focus_level: level })
                                }
                                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                                  active
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Nhận xét chi tiết + Gợi ý nhanh */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Nhận xét chi tiết của giáo viên
                        </label>
                        <textarea
                          rows={4}
                          value={studentForm.teacher_comments}
                          onChange={(e) =>
                            setStudentForm({
                              ...studentForm,
                              teacher_comments: e.target.value,
                            })
                          }
                          placeholder="Ghi nhận điểm mạnh, sản phẩm hoàn thành trong buổi học và góp ý cải thiện..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="text-[11px] font-medium text-slate-400 py-1 mr-1">
                            Chèn nhanh:
                          </span>
                          {QUICK_COMMENT_CHIPS.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setStudentForm((prev) => ({
                                  ...prev,
                                  teacher_comments: prev.teacher_comments
                                    ? `${prev.teacher_comments.trim()} ${chip}`
                                    : chip,
                                }))
                              }
                              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/80 transition-colors"
                            >
                              + {chip.length > 36 ? `${chip.slice(0, 36)}...` : chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Người báo cáo <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={dailyForm.reporter_name}
                            onChange={(e) =>
                              setDailyForm({ ...dailyForm, reporter_name: e.target.value })
                            }
                            placeholder="VD: Lê Minh Tuấn"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Dự án / Nhiệm vụ
                          </label>
                          <input
                            type="text"
                            value={dailyForm.project_name}
                            onChange={(e) =>
                              setDailyForm({ ...dailyForm, project_name: e.target.value })
                            }
                            placeholder="VD: Phát triển App Báo cáo & Streak"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Công việc đã hoàn thành
                        </label>
                        <BulletTextarea
                          rows={3}
                          value={dailyForm.completed_tasks}
                          onChange={(val) =>
                            setDailyForm((prev) => ({ ...prev, completed_tasks: val }))
                          }
                          placeholder="- Hoàn thành thiết kế giao diện&#10;- Kiểm thử API đánh dấu streak"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Kế hoạch tiếp theo
                        </label>
                        <textarea
                          rows={2}
                          value={dailyForm.next_plan}
                          onChange={(e) =>
                            setDailyForm({ ...dailyForm, next_plan: e.target.value })
                          }
                          placeholder="- Triển khai bản thử nghiệm lên server&#10;- Tối ưu hiển thị trên mobile"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Khó khăn / Ghi chú
                        </label>
                        <textarea
                          rows={2}
                          value={dailyForm.blockers}
                          onChange={(e) =>
                            setDailyForm({ ...dailyForm, blockers: e.target.value })
                          }
                          placeholder="Ghi chú các vấn đề cần hỗ trợ (nếu có)..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Nút Lưu báo cáo */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={isSyncing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm shadow-sm shadow-indigo-200 transition-all disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {apiMode === 'fastapi'
                          ? 'Lưu báo cáo lên FastAPI'
                          : 'Lưu báo cáo vào lịch sử'}
                      </span>
                    </button>
                  </div>
                </form>
              </section>

              {/* CỘT PHẢI: XEM TRƯỚC TRỰC TIẾP & HÀNH ĐỘNG NHANH */}
              <section className="lg:col-span-5 lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Xem trước trực tiếp
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {formatDateVN(currentDateISO)}
                  </span>
                </div>

                <div className="p-5">
                  <div className="rounded-xl bg-slate-900 text-slate-100 p-4 sm:p-5 font-mono text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-inner min-h-[270px] max-h-[420px] overflow-y-auto">
                    {liveReportText}
                  </div>

                  {/* Các nút thao tác nhanh */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCopyText(liveReportText, 'preview')}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        copiedId === 'preview'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70'
                      }`}
                    >
                      {copiedId === 'preview' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao chép báo cáo</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleExportTxt}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Xuất file .txt</span>
                    </button>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-400 text-center">
                    Định dạng tối ưu để dán trực tiếp vào Zalo, Slack, Email hoặc Google Classroom.
                  </p>
                </div>
              </section>
            </div>

            {/* LỊCH SỬ BÁO CÁO ĐÃ LƯU */}
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900">
                    Lịch sử báo cáo đã lưu
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {savedReports.length}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Nguồn dữ liệu:{' '}
                  <strong className="text-slate-700">
                    {apiMode === 'fastapi' ? `FastAPI (${apiBaseUrl})` : 'LocalStorage'}
                  </strong>
                </span>
              </div>

              {savedReports.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">
                    Chưa có báo cáo nào được lưu
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hãy soạn báo cáo ở biểu mẫu phía trên và nhấn &quot;Lưu báo cáo&quot;.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {savedReports.map((report) => {
                    const isStudent = report.templateType !== 'daily';
                    const formattedText =
                      !isStudent && report.teacher_comments?.includes('BÁO CÁO CÔNG VIỆC')
                        ? report.teacher_comments
                        : generateFormattedReport(
                            isStudent ? 'student' : 'daily',
                            report,
                            report.created_at
                          );

                    const title = isStudent
                      ? report.student_name
                      : report.reporter_name || report.student_name;
                    const subtitle = isStudent
                      ? report.course_name
                      : report.project_name || report.course_name;

                    return (
                      <div
                        key={report.id}
                        className="p-4 sm:px-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                isStudent
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : 'bg-sky-50 text-sky-700 border border-sky-100'
                              }`}
                            >
                              {isStudent ? 'Đánh giá học viên' : 'Báo cáo ngày'}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateVN(report.created_at)}
                            </span>
                            {isStudent && report.logic_score !== undefined && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                {report.logic_score}/10 điểm • {report.focus_level}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {title}
                            </h4>
                            <span className="text-xs text-slate-500 truncate">
                              — {subtitle}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            {isStudent
                              ? report.teacher_comments
                              : report.completed_tasks || report.teacher_comments}
                          </p>
                        </div>

                        {/* Nút thao tác từng dòng */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewModalReport({
                                title,
                                subtitle,
                                date: report.created_at,
                                content: formattedText,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(formattedText, `rep-${report.id}`)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              copiedId === `rep-${report.id}`
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200/70 hover:bg-indigo-100'
                            }`}
                          >
                            {copiedId === `rep-${report.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>

                          {confirmDeleteReportId === report.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(report.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                              >
                                Xóa
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteReportId(null)}
                                className="px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReportId(report.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa báo cáo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CHECKLIST & ĐẾM STREAK                                     */}
        {/* ================================================================= */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            {/* 3 Thẻ thống kê tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Thẻ 1: Tiến độ hôm nay */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tiến độ hôm nay
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {checklistStats.completed}
                    <span className="text-base font-semibold text-slate-400">
                      /{checklistStats.total}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {checklistStats.percent}% hoàn thành
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${checklistStats.percent}%` }}
                  />
                </div>
              </div>

              {/* Thẻ 2: Streak cao nhất */}
              <div className="bg-gradient-to-br from-orange-50/90 via-white to-amber-50/70 rounded-2xl border border-orange-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-700/80">
                    Streak cao nhất
                  </span>
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                    <Flame className="w-4 h-4 fill-orange-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-orange-600">
                    {checklistStats.maxStreak}
                  </span>
                  <span className="text-sm font-bold text-orange-700/80">ngày liên tiếp</span>
                </div>
                <p className="text-xs text-orange-700/70 mt-1.5">
                  Duy trì check mỗi ngày để không bị đứt chuỗi!
                </p>
              </div>

              {/* Thẻ 3: Tổng số task theo dõi */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Đang theo dõi
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <ListChecks className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {checklistStats.total}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">thói quen / việc</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Ngày ghi nhận: <strong className="text-slate-600">{formatDateVN(currentDateISO)}</strong>
                </p>
              </div>
            </div>

            {/* Khu vực thêm công việc & Mô phỏng qua ngày mới */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                <form onSubmit={handleAddTask} className="flex-1 flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Nhập công việc cần duy trì mỗi ngày (VD: Đọc sách 20 phút, Review code...)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm việc</span>
                  </button>
                </form>

                {/* Nút Mô phỏng qua ngày mới (chỉ hiện ở Demo mode) */}
                {apiMode === 'local' && (
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 lg:pl-3 lg:border-l border-slate-100">
                    <button
                      type="button"
                      onClick={handleSimulateNextDay}
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 text-xs font-bold transition-colors"
                      title="Kiểm thử tăng chuỗi liên tiếp hoặc tự động reset streak nếu bỏ lỡ ngày hôm nay"
                    >
                      <FastForward className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mô phỏng qua ngày mới</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Danh sách Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Checklist hàng ngày
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nhấn nút Check để hoàn thành hôm nay và giữ ngọn lửa streak luôn cháy.
                  </p>
                </div>
                {checklistStats.total > 0 && checklistStats.completed === checklistStats.total && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <Award className="w-3.5 h-3.5" />
                    Hoàn hảo hôm nay!
                  </span>
                )}
              </div>

              {tasks.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">
                    Danh sách checklist đang trống
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Thêm công việc đầu tiên ở ô phía trên để bắt đầu đếm streak nhé!
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {tasks.map((task) => {
                    const isDone = task.is_completed_today;
                    const isJustChecked = justCheckedTaskId === task.id;
                    const hasStreak = (task.current_streak || 0) > 0;

                    return (
                      <li
                        key={task.id}
                        className={`p-4 sm:px-5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isJustChecked
                            ? 'bg-orange-50/80'
                            : isDone
                            ? 'bg-slate-50/60'
                            : 'bg-white hover:bg-slate-50/40'
                        }`}
                      >
                        {/* Nút Check + Thông tin Task */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleCheckTask(task)}
                            disabled={isDone || isSyncing}
                            aria-label={`Đánh dấu hoàn thành ${task.task_name}`}
                            className={`mt-0.5 sm:mt-0 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                              isDone
                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 cursor-default'
                                : 'bg-white border-2 border-slate-300 text-slate-300 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 cursor-pointer'
                            }`}
                          >
                            <Check className="w-5 h-5 stroke-[2.75]" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm sm:text-[15px] font-semibold transition-colors ${
                                isDone ? 'text-slate-400 line-through' : 'text-slate-900'
                              }`}
                            >
                              {task.task_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Lần cuối: {formatDateVN(task.last_completed_date)}
                              </span>
                              {isDone && (
                                <span className="text-emerald-600 font-semibold">
                                  • Đã hoàn thành hôm nay
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Huy hiệu Streak & Hành động */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 pl-13 sm:pl-0">
                          {/* Badge ngọn lửa Streak */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold text-xs transition-all duration-300 ${
                              isJustChecked
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 scale-110 shadow-md shadow-orange-200'
                                : hasStreak
                                ? 'bg-orange-50 text-orange-600 border-orange-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            <Flame
                              className={`w-4 h-4 ${
                                isJustChecked
                                  ? 'fill-white text-white animate-bounce'
                                  : hasStreak
                                  ? 'fill-orange-500 text-orange-500'
                                  : 'text-slate-400'
                              }`}
                            />
                            <span>{task.current_streak} ngày</span>
                          </div>

                          {/* Nút Hoàn tác (chỉ hiển thị ở chế độ Demo Local khi đã check hôm nay) */}
                          {apiMode === 'local' && isDone && (
                            <button
                              type="button"
                              onClick={() => handleUndoTaskLocal(task)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-colors"
                              title="Hoàn tác trạng thái hoàn thành hôm nay"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Hoàn tác</span>
                            </button>
                          )}

                          {/* Nút Xóa với xác nhận 2 bước inline */}
                          {confirmDeleteTaskId === task.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                              >
                                Xóa
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTaskId(null)}
                                className="px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTaskId(task.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa công việc"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODAL XEM CHI TIẾT BÁO CÁO ==================== */}
      {previewModalReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalReport(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {previewModalReport.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewModalReport.subtitle} • {formatDateVN(previewModalReport.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
                {previewModalReport.content}
              </pre>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(previewModalReport.content, 'modal')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                >
                  {copiedId === 'modal' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép nội dung</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CẤU HÌNH FASTAPI ==================== */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Cấu hình kết nối Python FastAPI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApiSettings} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  FastAPI Base URL
                </label>
                <input
                  type="url"
                  required
                  value={tempUrlInput}
                  onChange={(e) => setTempUrlInput(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-800">Endpoints được kết nối tự động:</p>
                <ul className="font-mono text-[11px] space-y-1 text-slate-600">
                  <li>• GET /reports/ &amp; POST /reports/</li>
                  <li>• GET /tasks/ &amp; POST /tasks/{'{id}'}/check</li>
                </ul>
                <p className="pt-1.5 text-[11px] text-amber-700">
                  <strong>Lưu ý CORS:</strong> Hãy thêm <code>CORSMiddleware</code> vào file{' '}
                  <code>main.py</code> của FastAPI để trình duyệt cho phép gọi API từ React.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Lưu địa chỉ API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== HỆ THỐNG THÔNG BÁO TOAST ==================== */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((toast) => {
          const styles = {
            success: 'bg-emerald-600 text-white shadow-emerald-200',
            error: 'bg-rose-600 text-white shadow-rose-200',
            streak:
              'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200',
            info: 'bg-slate-800 text-white shadow-slate-300',
          };
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'error'
              ? AlertCircle
              : toast.type === 'streak'
              ? Flame
              : Info;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
                styles[toast.type] || styles.info
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}