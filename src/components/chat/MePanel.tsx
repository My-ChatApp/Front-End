import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Calendar,
  Camera,
  ChevronLeft,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Settings,
  User,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { Alert } from '@/components/Alert';
import { FieldError } from '@/components/FieldError';
import { setCachedUserDisplayName } from '@/hooks/useUserDisplayName';
import { profileService } from '@/services/profileService';
import { UserGender, UserProfile } from '@/types';
import { getInitials } from '@/utils/chatUtils';
import { formatDobDisplay, genderLabel, resolveAvatarUrl } from '@/utils/profileUtils';
import {
  FieldErrors,
  inputErrorClass,
  validateAvatarFile,
  validateProfileForm,
} from '@/utils/validation';

function resolveDisplayName(
  profile: UserProfile | null,
  authUsername?: string,
  authEmail?: string
): string {
  return (
    profile?.displayName?.trim() ||
    profile?.username?.trim() ||
    authUsername?.trim() ||
    profile?.email?.trim() ||
    authEmail?.trim() ||
    'User'
  );
}

function normalizeDateOfBirth(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value as number[];
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return '';
}

function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="me-profile-info-row">
      <span className="me-profile-info-icon">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--discord-text-faint)]">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-[var(--discord-text)]">{value}</p>
      </div>
    </div>
  );
}

function MeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md animate-pulse px-4 py-6">
      <div className="me-profile-card overflow-hidden">
        <div className="me-profile-banner chat-skeleton !rounded-none !bg-[var(--discord-hover)]" />
        <div className="px-5 pb-5">
          <div className="-mt-10 size-20 rounded-full chat-skeleton" />
          <div className="mt-4 h-5 w-40 rounded chat-skeleton" />
          <div className="mt-2 h-3 w-28 rounded chat-skeleton" />
        </div>
      </div>
      <div className="me-profile-card mt-4 p-4 space-y-3">
        <div className="h-10 rounded chat-skeleton" />
        <div className="h-10 rounded chat-skeleton" />
        <div className="h-10 rounded chat-skeleton" />
      </div>
    </div>
  );
}

export const MePanel = () => {
  const { user, logout } = useAuth();
  const { socketConnected } = useChat();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [genderInput, setGenderInput] = useState<UserGender | ''>('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<'displayName' | 'phone' | 'dateOfBirth' | 'gender'>
  >({});
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id || '';
  const email = profile?.email || user?.email || '';
  const username = profile?.username || user?.username || '';
  const displayName = resolveDisplayName(profile, user?.username, user?.email);
  const dateOfBirth = normalizeDateOfBirth(profile?.dateOfBirth);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setIsLoadingProfile(true);
    profileService
      .getById(userId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setProfile(res.data);
          if (res.data.avatarUrl) {
            setAvatarPreview(res.data.avatarUrl);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const avatarSrc = avatarPreview ?? resolveAvatarUrl(profile?.avatarUrl);

  useEffect(() => {
    setAvatarImageFailed(false);
  }, [avatarSrc]);

  const resetEditForm = () => {
    setDisplayNameInput(
      profile?.displayName?.trim() || profile?.username?.trim() || user?.username || ''
    );
    setPhoneInput(profile?.phone?.trim() || '');
    setBirthDateInput(normalizeDateOfBirth(profile?.dateOfBirth));
    const g = String(profile?.gender || '').toUpperCase();
    setGenderInput(
      g === 'MALE' || g === 'FEMALE' || g === 'OTHER' ? (g as UserGender) : ''
    );
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(profile?.avatarUrl || null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const startEditing = () => {
    resetEditForm();
    setIsEditing(true);
    setStatusMessage(null);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const cancelEditing = () => {
    resetEditForm();
    setIsEditing(false);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const buildSavePayload = () => ({
    displayName: displayNameInput.trim(),
    phone: phoneInput.trim(),
    dateOfBirth: birthDateInput.trim(),
    gender: genderInput,
  });

  const uploadAvatar = async (file: File) => {
    const avatarError = validateAvatarFile(file);
    if (avatarError) {
      setErrorMessage(avatarError);
      return;
    }

    const profileValidation = validateProfileForm({
      displayName: isEditing
        ? displayNameInput
        : resolveDisplayName(profile, user?.username, user?.email),
      phone: isEditing ? phoneInput : profile?.phone?.trim() || '',
      dateOfBirth: isEditing
        ? birthDateInput
        : normalizeDateOfBirth(profile?.dateOfBirth),
      gender: isEditing ? genderInput : (String(profile?.gender || '') as UserGender | ''),
    });
    if (!profileValidation.valid) {
      setFieldErrors(profileValidation.fields);
      setErrorMessage(profileValidation.message);
      return;
    }

    const nameForSave = isEditing
      ? displayNameInput.trim()
      : resolveDisplayName(profile, user?.username, user?.email);

    setIsUploadingAvatar(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const options = isEditing
      ? buildSavePayload()
      : {
          displayName: nameForSave,
          phone: profile?.phone?.trim() || '',
          dateOfBirth: normalizeDateOfBirth(profile?.dateOfBirth),
          gender: String(profile?.gender || ''),
        };

    try {
      const response = await profileService.updateAvatarViaPresign(file, options);
      if (response.data) {
        applyProfileResponse(response.data as UserProfile, response.message || 'Đã cập nhật ảnh đại diện', {
          keepEditing: isEditing,
        });
      } else {
        setStatusMessage(response.message || 'Đã cập nhật ảnh đại diện');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(e.response?.data?.message || e.message || 'Không thể tải ảnh lên');
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(profile?.avatarUrl || null);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const avatarError = validateAvatarFile(file);
    if (avatarError) {
      setErrorMessage(avatarError);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
      return;
    }

    setErrorMessage(null);
    setFieldErrors({});
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
    await uploadAvatar(file);
  };

  const openAvatarPicker = () => {
    if (!isSaving && !isUploadingAvatar) {
      avatarInputRef.current?.click();
    }
  };

  const applyProfileResponse = (
    data: UserProfile,
    message?: string,
    opts?: { keepEditing?: boolean }
  ) => {
    setProfile(data);
    const name = resolveDisplayName(data, user?.username, user?.email);
    if (userId && name) {
      setCachedUserDisplayName(userId, name);
    }
    if (data.avatarUrl) {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(data.avatarUrl);
    }
    setDisplayNameInput(data.displayName?.trim() || data.username?.trim() || '');
    setPhoneInput(data.phone?.trim() || '');
    setBirthDateInput(normalizeDateOfBirth(data.dateOfBirth));
    const g = String(data.gender || '').toUpperCase();
    setGenderInput(
      g === 'MALE' || g === 'FEMALE' || g === 'OTHER' ? (g as UserGender) : ''
    );
    if (!opts?.keepEditing) {
      setIsEditing(false);
    }
    setStatusMessage(message || 'Cập nhật thành công');
    setErrorMessage(null);
  };

  const handleSave = async () => {
    const validation = validateProfileForm({
      displayName: displayNameInput,
      phone: phoneInput,
      dateOfBirth: birthDateInput,
      gender: genderInput,
    });
    if (!validation.valid) {
      setFieldErrors(validation.fields);
      setErrorMessage(validation.message);
      return;
    }

    setFieldErrors({});
    setIsSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await profileService.updateProfile(buildSavePayload());
      if (response.data) {
        applyProfileResponse(response.data as UserProfile, response.message);
      } else {
        setStatusMessage(response.message || 'Cập nhật thành công');
        setIsEditing(false);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(e.response?.data?.message || e.message || 'Không thể cập nhật profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarBusy = isUploadingAvatar || isSaving;
  const nameForAvatar = isEditing ? displayNameInput || displayName : displayName;

  const inputClass =
    'w-full rounded-md border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] px-3 py-2.5 text-sm text-[var(--discord-text)] outline-none transition-colors focus:border-[var(--discord-accent)] disabled:opacity-60';

  const renderAvatar = (sizeClass: string, textClass: string) => (
    <button
      type="button"
      onClick={openAvatarPicker}
      disabled={avatarBusy}
      title="Đổi ảnh đại diện"
      className={`group relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--discord-accent)] font-bold text-white me-profile-avatar-ring disabled:opacity-60 ${sizeClass} ${textClass}`}
    >
      {avatarImageFailed ? (
        getInitials(nameForAvatar)
      ) : (
        <img src={avatarSrc} alt="" className="size-full object-cover" onError={() => setAvatarImageFailed(true)} />
      )}
      <span
        className={`absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity ${
          isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {isUploadingAvatar ? (
          <Loader2 className="size-7 animate-spin text-white" />
        ) : (
          <Camera className="size-6 text-white" />
        )}
      </span>
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col discord-chat-area">
      <header className="discord-topbar flex h-12 shrink-0 items-center gap-2 px-4">
        {isEditing ? (
          <button
            type="button"
            onClick={cancelEditing}
            disabled={isSaving}
            className="discord-icon-button flex size-8 items-center justify-center"
            aria-label="Quay lại"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <User className="size-5 text-[var(--discord-text-muted)]" />
        )}
        <h1 className="text-sm font-semibold">
          {isEditing ? 'Chỉnh sửa hồ sơ' : 'Tài khoản của tôi'}
        </h1>
      </header>

      <div className="me-profile-scroll flex flex-1 flex-col overflow-y-auto">
        {(statusMessage || (errorMessage && !isEditing)) && (
          <div className="mx-auto w-full max-w-md space-y-2 px-4 pt-4">
            {statusMessage && (
              <Alert
                type="success"
                message={statusMessage}
                onClose={() => setStatusMessage(null)}
                className="!rounded-lg !p-3 !text-xs"
              />
            )}
            {errorMessage && !isEditing && (
              <Alert
                type="error"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
                className="!rounded-lg !p-3 !text-xs"
              />
            )}
          </div>
        )}

        {isLoadingProfile && !profile ? (
          <MeSkeleton />
        ) : (
          <div className="mx-auto w-full max-w-md px-4 py-5">
            {/* Hero card */}
            <div className="me-profile-card overflow-hidden">
              <div className="me-profile-banner" aria-hidden />
              <div className="relative px-5 pb-5">
                <div className="-mt-10 flex items-end justify-between gap-3">
                  {renderAvatar('size-20 text-2xl', '')}
                  {!isEditing && (
                    <span className="me-profile-status mb-1">
                      <span
                        className={`size-2 rounded-full ${
                          socketConnected
                            ? 'bg-[var(--discord-success)]'
                            : 'bg-[var(--discord-text-faint)]'
                        }`}
                      />
                      {socketConnected ? 'Trực tuyến' : 'Ngoại tuyến'}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h2 className="text-xl font-bold tracking-tight text-[var(--discord-text)]">
                    {isEditing ? displayNameInput || displayName : displayName}
                  </h2>
                  {username && (
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--discord-text-muted)]">
                      <AtSign className="size-3.5 shrink-0 opacity-70" />
                      {username}
                    </p>
                  )}
                  {email && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--discord-text-faint)]">
                      <Mail className="size-3.5 shrink-0" />
                      <span className="truncate">{email}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {isEditing ? (
              <div className="me-profile-card mt-4 p-5">
                {errorMessage && (
                  <Alert
                    type="error"
                    message={errorMessage}
                    onClose={() => setErrorMessage(null)}
                    className="mb-4 !rounded-lg !p-3 !text-xs"
                  />
                )}

                <p className="mb-4 text-xs leading-relaxed text-[var(--discord-text-muted)]">
                  Nhấn ảnh đại diện ở trên để đổi ảnh — tải lên tự động sau khi chọn file.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="discord-section-title mb-1.5 block">Tên hiển thị</label>
                    <input
                      value={displayNameInput}
                      onChange={(e) => {
                        setDisplayNameInput(e.target.value);
                        if (fieldErrors.displayName) {
                          setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
                        }
                      }}
                      disabled={isSaving}
                      placeholder="Tên của bạn"
                      className={inputErrorClass(!!fieldErrors.displayName, inputClass)}
                    />
                    <FieldError message={fieldErrors.displayName} />
                  </div>

                  <div>
                    <label className="discord-section-title mb-1.5 block">Số điện thoại</label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(e.target.value);
                        if (fieldErrors.phone) {
                          setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                        }
                      }}
                      disabled={isSaving}
                      placeholder="+84..."
                      className={inputErrorClass(!!fieldErrors.phone, inputClass)}
                    />
                    <FieldError message={fieldErrors.phone} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="discord-section-title mb-1.5 block">Ngày sinh</label>
                      <input
                        type="date"
                        value={birthDateInput}
                        onChange={(e) => {
                          setBirthDateInput(e.target.value);
                          if (fieldErrors.dateOfBirth) {
                            setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                          }
                        }}
                        disabled={isSaving}
                        max={new Date().toISOString().slice(0, 10)}
                        className={inputErrorClass(!!fieldErrors.dateOfBirth, inputClass)}
                      />
                      <FieldError message={fieldErrors.dateOfBirth} />
                    </div>
                    <div>
                      <label className="discord-section-title mb-1.5 block">Giới tính</label>
                      <select
                        value={genderInput}
                        onChange={(e) => {
                          setGenderInput(e.target.value as UserGender | '');
                          if (fieldErrors.gender) {
                            setFieldErrors((prev) => ({ ...prev, gender: undefined }));
                          }
                        }}
                        disabled={isSaving}
                        className={inputErrorClass(!!fieldErrors.gender, inputClass)}
                      >
                        <option value="">Chưa chọn</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                      <FieldError message={fieldErrors.gender} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="me-action-btn me-action-btn--primary flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="me-action-btn me-action-btn--secondary px-4"
                    aria-label="Hủy"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="me-profile-card mt-4 p-4">
                  <h3 className="discord-section-title mb-3">Thông tin cá nhân</h3>
                  <ProfileInfoRow
                    icon={<Phone className="size-4" />}
                    label="Số điện thoại"
                    value={profile?.phone?.trim() || 'Chưa cập nhật'}
                  />
                  <ProfileInfoRow
                    icon={<Calendar className="size-4" />}
                    label="Ngày sinh"
                    value={
                      dateOfBirth ? formatDobDisplay(dateOfBirth) : 'Chưa cập nhật'
                    }
                  />
                  <ProfileInfoRow
                    icon={<UserCircle className="size-4" />}
                    label="Giới tính"
                    value={
                      profile?.gender ? genderLabel(profile.gender) : 'Chưa cập nhật'
                    }
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={openAvatarPicker}
                      disabled={avatarBusy}
                      className="me-action-btn me-action-btn--secondary"
                    >
                      <Camera className="size-4" />
                      {isUploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}
                    </button>
                    <button
                      type="button"
                      onClick={startEditing}
                      className="me-action-btn me-action-btn--primary"
                    >
                      <Pencil className="size-4" />
                      Chỉnh sửa
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="me-action-btn me-action-btn--ghost"
                  >
                    <Settings className="size-4" />
                    Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="me-action-btn me-action-btn--danger"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
