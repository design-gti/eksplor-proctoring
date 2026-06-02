import { useState } from 'react'
import {
  FullscreenIcon, TabIcon, ScreenShareIcon, MonitorIcon,
  FaceIcon, PhoneIcon, LockIcon, ShieldIcon, CameraFaceIcon,
  WarningIcon, ClipboardIcon
} from '../components/icons'

const rules = [
  {
    icon: FullscreenIcon,
    title: 'Mode Fullscreen Wajib',
    desc: 'Assessment harus dikerjakan dalam mode fullscreen',
  },
  {
    icon: TabIcon,
    title: 'Dilarang Berpindah Tab',
    desc: 'Anda tidak diperbolehkan berpindah tab saat assessment berlangsung',
  },
  {
    icon: ScreenShareIcon,
    title: 'Dilarang Melakukan Screen Sharing',
    desc: 'Anda tidak diperbolehkan melakukan screen sharing',
  },
  {
    icon: MonitorIcon,
    title: 'Dilarang Menggunakan Multiple Monitor',
    desc: 'Hanya boleh menggunakan satu monitor',
  },
  {
    icon: FaceIcon,
    title: 'Wajah Harus Terdeteksi',
    desc: 'Wajah Anda harus terdeteksi dan hanya boleh ada satu wajah',
  },
  {
    icon: PhoneIcon,
    title: 'Dilarang Menggunakan Ponsel',
    desc: 'Ponsel dan perangkat elektronik lainnya tidak boleh terdeteksi kamera',
  },
  {
    icon: LockIcon,
    title: 'Dilarang Refresh atau Tutup Halaman',
    desc: 'Jangan me-refresh atau menutup halaman ini selama assessment berlangsung',
  },
]

export default function AssessmentPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Camera state: 'not_detected' | 'detected' | 'loading'
  const cameraStatus = 'not_detected'

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const canStart = isFullscreen && cameraStatus === 'detected'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-blue-700">Assessment</span>{' '}
            <span className="text-orange-500">Online</span>
          </h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Selamat datang di assessment online. Sebelum memulai, pastikan Anda memahami aturan-aturan berikut:
          </p>
        </div>

        {/* Two column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Left: Rules */}
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 bg-blue-700 text-white px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">Aturan Assessment</span>
            </div>
            <div className="divide-y divide-gray-100">
              {rules.map((rule, i) => {
                const Icon = rule.icon
                return (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{rule.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Camera status */}
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 bg-orange-500 text-white px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CameraFaceIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">Status Kamera</span>
            </div>
            <div className="flex flex-col items-center justify-center py-12 px-6 gap-5">
              {cameraStatus === 'not_detected' ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                    <CameraFaceIcon className="w-12 h-12 text-red-500" />
                  </div>
                  <p className="font-bold text-red-500 text-lg">Wajah Tidak Terdeteksi</p>
                  <div className="flex items-center gap-2 border border-orange-300 rounded-lg px-5 py-3 bg-orange-50 text-orange-600 text-sm font-medium">
                    <WarningIcon className="w-5 h-5 text-orange-400 shrink-0" />
                    Posisikan wajah Anda dengan jelas di depan kamera
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                    <CameraFaceIcon className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="font-bold text-green-600 text-lg">Wajah Terdeteksi</p>
                  <div className="flex items-center gap-2 border border-green-300 rounded-lg px-5 py-3 bg-green-50 text-green-600 text-sm font-medium">
                    Wajah Anda berhasil terdeteksi
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-2 px-7 py-3 border-2 border-orange-500 text-orange-500 rounded-xl font-semibold hover:bg-orange-50 transition-colors cursor-pointer"
            >
              <FullscreenIcon className="w-5 h-5" />
              {isFullscreen ? 'Keluar Fullscreen' : 'Aktifkan Fullscreen'}
            </button>
            <button
              disabled={!canStart}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl font-semibold transition-colors ${
                canStart
                  ? 'bg-blue-700 text-white hover:bg-blue-800 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ClipboardIcon className="w-5 h-5" />
              Mulai Assessment
            </button>
          </div>

          {!canStart && (
            <div className="flex items-center gap-2 border border-orange-300 rounded-xl px-6 py-3 bg-orange-50 text-orange-600 text-sm font-medium">
              <WarningIcon className="w-5 h-5 text-orange-400 shrink-0" />
              {cameraStatus !== 'detected'
                ? 'Wajah Anda harus terdeteksi untuk memulai assessment'
                : 'Aktifkan fullscreen untuk memulai assessment'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
