"use client";

import { useState } from "react";

interface PromptVersion {
  id: string;
  version: string;
  content: string;
  isActive: boolean;
  activatedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function PromptManager({ prompts }: { prompts: PromptVersion[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [compareId, setCompareId] = useState<string | null>(null);

  const activePrompt = prompts.find((p) => p.isActive);
  const comparePrompt = compareId ? prompts.find((p) => p.id === compareId) : null;

  async function createPrompt() {
    if (!newVersion.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: newVersion, content: newContent }),
      });
      setShowCreate(false);
      setNewVersion("");
      setNewContent("");
      window.location.reload();
    } catch {
      alert("생성 실패");
    } finally {
      setSaving(false);
    }
  }

  async function activatePrompt(id: string) {
    const target = prompts.find((p) => p.id === id);
    const msg = activePrompt
      ? `v${target?.version}을 활성화하면 현재 활성 버전(v${activePrompt.version})이 비활성화됩니다. 진행할까요?`
      : `v${target?.version}을 활성화하시겠습니까?`;
    if (!confirm(msg)) return;
    try {
      await fetch(`/api/admin/prompts/${id}/activate`, { method: "POST" });
      window.location.reload();
    } catch {
      alert("활성화 실패");
    }
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: prompts.find((p) => p.id === id)?.version + "-edit",
          content: editContent,
        }),
      });
      setEditingId(null);
      window.location.reload();
    } catch {
      alert("저장 실패");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(prompt: PromptVersion) {
    setEditingId(prompt.id);
    setEditContent(prompt.content);
  }

  return (
    <>
      <div className="admin-prompt-actions">
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "취소" : "+ 새 버전 추가"}
        </button>
      </div>

      {/* A/B 비교 뷰 */}
      {comparePrompt && activePrompt && (
        <div className="admin-section-card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3>A/B 비교: v{activePrompt.version} (활성) vs v{comparePrompt.version}</h3>
            <button className="admin-btn admin-btn-sm" onClick={() => setCompareId(null)}>닫기</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <h4 style={{ color: "#3ecf8e", marginBottom: 8 }}>v{activePrompt.version} (현재 활성)</h4>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, maxHeight: 400, overflow: "auto", padding: 12, background: "#1a1a1a", borderRadius: 8 }}>
                {activePrompt.content}
              </pre>
            </div>
            <div>
              <h4 style={{ color: "#b4b4b4", marginBottom: 8 }}>v{comparePrompt.version}</h4>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, maxHeight: 400, overflow: "auto", padding: 12, background: "#1a1a1a", borderRadius: 8 }}>
                {comparePrompt.content}
              </pre>
            </div>
          </div>
          {!comparePrompt.isActive && (
            <button
              className="admin-btn admin-btn-success"
              style={{ marginTop: 12 }}
              onClick={() => activatePrompt(comparePrompt.id)}
            >
              v{comparePrompt.version}으로 롤백
            </button>
          )}
        </div>
      )}

      {showCreate && (
        <div className="admin-section-card admin-prompt-create">
          <h3>새 프롬프트 버전</h3>
          <div className="admin-edit-field">
            <label>버전 (예: 1.1.0)</label>
            <input
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="1.1.0"
            />
          </div>
          <div className="admin-edit-field">
            <label>프롬프트 내용</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={12}
              placeholder="프롬프트 전문을 입력하세요..."
              className="admin-prompt-textarea"
            />
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={createPrompt}
            disabled={saving}
          >
            {saving ? "생성 중..." : "생성"}
          </button>
        </div>
      )}

      {/* 편집 모달 */}
      {editingId && (
        <div className="admin-section-card" style={{ marginBottom: 24 }}>
          <h3>프롬프트 편집 (새 버전으로 저장됨)</h3>
          <div className="admin-edit-field">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={16}
              className="admin-prompt-textarea"
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="admin-btn admin-btn-primary" onClick={() => saveEdit(editingId)} disabled={saving}>
              {saving ? "저장 중..." : "새 버전으로 저장"}
            </button>
            <button className="admin-btn" onClick={() => setEditingId(null)}>취소</button>
          </div>
        </div>
      )}

      <div className="admin-prompt-list">
        {prompts.map((p) => (
          <div
            key={p.id}
            className={`admin-prompt-item ${p.isActive ? "active" : ""}`}
          >
            <div className="admin-prompt-header" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
              <div className="admin-prompt-meta">
                <span className="admin-prompt-version">v{p.version}</span>
                {p.isActive && <span className="admin-badge-active">활성</span>}
                <span className="admin-prompt-date">
                  {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                </span>
                {p.createdBy && (
                  <span className="admin-prompt-author">by {p.createdBy}</span>
                )}
              </div>
              <div className="admin-prompt-actions-inline">
                {!p.isActive && (
                  <>
                    <button
                      className="admin-btn admin-btn-sm admin-btn-success"
                      onClick={(e) => { e.stopPropagation(); activatePrompt(p.id); }}
                    >
                      활성화
                    </button>
                    {activePrompt && (
                      <button
                        className="admin-btn admin-btn-sm"
                        onClick={(e) => { e.stopPropagation(); setCompareId(p.id); }}
                      >
                        비교
                      </button>
                    )}
                  </>
                )}
                <button
                  className="admin-btn admin-btn-sm"
                  onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                >
                  편집
                </button>
                <span className="admin-expand-icon">
                  {expandedId === p.id ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {expandedId === p.id && (
              <div className="admin-prompt-content">
                <pre>{p.content}</pre>
              </div>
            )}
          </div>
        ))}

        {prompts.length === 0 && (
          <p className="admin-empty">등록된 프롬프트가 없습니다. 위 버튼으로 첫 버전을 추가하세요.</p>
        )}
      </div>
    </>
  );
}
