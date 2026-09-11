import { clinicLogoUrl, QUEUE_UI, UI_TEXT } from '@e-dentist/shared'
import { useParams } from 'react-router-dom'
import { useQueueScreen, useQueueStream } from '@/entities/queue'
import { ApiError } from '@/shared/api'

/// Kutish xonasidagi televizor. Faqat raqamlar: kutayotganlar
/// bir-birining ismini bilmasligi kerak (tz.md 14-boʻlim).
///
/// Ekran uzoqdan koʻrinishi kerak — shuning uchun oʻlchamlar ekran
/// balandligiga bogʻlangan (vh), sahifa esa qorongʻi
export function QueueScreen() {
  const { code = '' } = useParams()
  useQueueStream(code)
  const { data, isError, error } = useQueueScreen(code)

  if (isError) {
    return (
      <main className="bg-brand-deep flex min-h-dvh items-center justify-center p-8 text-white">
        <p className="text-2xl">{error instanceof ApiError ? error.message : UI_TEXT.offline}</p>
      </main>
    )
  }

  return (
    <main className="bg-brand-deep flex min-h-dvh flex-col p-[3vh] text-white">
      <div className="flex items-center justify-center gap-[2vh]">
        {data?.hasLogo && (
          <img
            src={clinicLogoUrl(code)}
            alt=""
            className="size-[7vh] rounded-lg bg-white/10 object-contain"
          />
        )}
        <h1 className="font-display text-center text-[4vh] font-bold tracking-tight">
          {data?.clinicName}
        </h1>
      </div>

      <section className="flex flex-1 flex-col items-center justify-center gap-[2vh]">
        <div className="text-[3vh] text-white/60">{QUEUE_UI.screen_now}</div>

        {data && data.called.length > 0 ? (
          <div className="flex flex-wrap items-start justify-center gap-[6vh]">
            {data.called.map((entry) => (
              <div key={entry.number} className="text-center">
                <div className="font-display text-[22vh] leading-none font-bold tabular-nums">
                  {entry.number}
                </div>
                <div className="mt-[1vh] text-[2.5vh] text-white/70">{entry.doctorName}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[8vh] text-white/25">—</div>
        )}
      </section>

      {data && data.next.length > 0 && (
        <footer className="border-t border-white/15 pt-[2vh] text-center">
          <div className="text-[2.5vh] text-white/60">{QUEUE_UI.screen_next}</div>
          <div className="font-display mt-[1vh] flex justify-center gap-[4vh] text-[7vh] font-bold tabular-nums text-white/85">
            {data.next.map((number) => (
              <span key={number}>{number}</span>
            ))}
          </div>
        </footer>
      )}
    </main>
  )
}
