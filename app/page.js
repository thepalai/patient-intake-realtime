import Link from 'next/link';

// Nobody has picked a language yet, so this page speaks Thai first and
// English second. In a clinic, a QR code or kiosk would open /patient directly.
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col bg-white sm:items-center sm:justify-center sm:bg-slate-50 sm:px-6">
      <div className="flex flex-1 flex-col px-6 py-10 sm:w-full sm:max-w-md sm:flex-none sm:rounded-2xl sm:bg-white sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-slate-200">
        <h1 className="text-4xl font-bold text-slate-900">ยินดีต้อนรับ</h1>
        <p lang="en" className="mt-1 text-xl text-slate-600">
          Welcome
        </p>
        <p className="mt-6 text-slate-700">
          แผนกผู้ป่วยนอก{' '}
          <span lang="en" className="text-slate-500">
            Outpatient department
          </span>
        </p>

        {/* On a phone the main action sits low, where a thumb reaches it. */}
        <div className="mt-auto pt-12 sm:mt-10 sm:pt-0">
          <Link
            href="/patient"
            className="block rounded-xl bg-blue-700 px-6 py-4 text-white hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden"
          >
            <span className="block text-xl font-semibold">เริ่มลงทะเบียน</span>
            <span lang="en" className="block text-blue-100">
              Start registration
            </span>
          </Link>
          <p className="mt-3 text-center text-sm text-slate-600">
            ใช้เวลาประมาณ 5 นาที <span lang="en">(about 5 minutes)</span>
          </p>

          <Link
            href="/staff"
            className="mt-10 block rounded text-center text-slate-700 underline underline-offset-4 hover:text-slate-900 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden"
          >
            สำหรับเจ้าหน้าที่ <span lang="en">(staff view)</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
