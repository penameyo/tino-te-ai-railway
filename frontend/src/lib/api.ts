// API 호출을 위한 기본 설정 및 유틸리티 함수

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // 백엔드 서버 주소

// API 요청을 위한 기본 헤더
const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// API 요청 함수
export const fetchApi = async (
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getHeaders(token);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    // 응답이 JSON이 아닌 경우를 처리
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || '요청 처리 중 오류가 발생했습니다.');
      }
      
      return data;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 요청 처리 중 오류가 발생했습니다.`);
    }
    
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    }
    throw error;
  }
};

// 로그인 함수
export const login = async (studentId: string, name: string) => {
  return fetchApi('/api/v1/login', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      name: name,
    }),
  });
};

// 사용자 정보 조회
export const getUserInfo = async (token: string) => {
  return fetchApi('/api/v1/users/me', {
    method: 'GET',
  }, token);
};

// 노트 목록 조회
export const getNotes = async (token: string) => {
  return fetchApi('/api/v1/notes', {
    method: 'GET',
  }, token);
};

// 노트 삭제
export const deleteNote = async (noteId: string, token: string) => {
  return fetchApi(`/api/v1/notes/${noteId}`, {
    method: 'DELETE',
  }, token);
};

// 미디어 파일로부터 노트 생성
export const createNoteFromMedia = async (file: File, token: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/api/v1/notes/from-media`;
    console.log('Sending request to:', url); // 디버깅용
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '미디어 파일 처리 중 오류가 발생했습니다.');
    }
    
    return response.json();
  } catch (error) {
    console.error('createNoteFromMedia error:', error); // 디버깅용
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    }
    throw error;
  }
};

// 문서 파일로부터 노트 생성
export const createNoteFromDocument = async (file: File, token: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/api/v1/notes/from-document`;
    console.log('Sending request to:', url); // 디버깅용
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '문서 파일 처리 중 오류가 발생했습니다.');
    }
    
    return response.json();
  } catch (error) {
    console.error('createNoteFromDocument error:', error); // 디버깅용
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    }
    throw error;
  }
};

// 특정 노트 조회
export const getNote = async (noteId: string, token: string) => {
  return fetchApi(`/api/v1/notes/${noteId}`, {
    method: 'GET',
  }, token);
};

// 폴더 생성 (클라이언트 사이드에서만 관리)
export const createFolder = (folderName: string, folders: any[]) => {
  const newFolder = {
    id: `folder-${Date.now()}`,
    name: folderName,
    notes: []
  };
  
  return [...folders, newFolder];
};

// 노트를 폴더에 추가 (클라이언트 사이드에서만 관리)
export const addNoteToFolder = (folderId: string, noteId: string, folders: any[]) => {
  return folders.map(folder => {
    if (folder.id === folderId) {
      return {
        ...folder,
        notes: [...folder.notes, noteId]
      };
    }
    return folder;
  });
};