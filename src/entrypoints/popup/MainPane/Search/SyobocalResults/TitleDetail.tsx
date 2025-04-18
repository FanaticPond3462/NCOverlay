import type { SyoboCalProgramDb } from '@midra/nco-api/types/syobocal/db'
import type { ScTitleItem } from './TitleItem'
import type { ScSubtitleItem, SubtitleItemHandle } from './SubtitleItem'

import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useImperativeHandle,
} from 'react'
import { Spinner, cn } from '@heroui/react'

import { SYOBOCAL_CHANNEL_IDS } from '@/constants/channels'

import { zeroPadding } from '@/utils/zeroPadding'
import { programToSlotDetail } from '@/utils/api/programToSlotDetail'
import { ncoApiProxy } from '@/proxy/nco-api/extension'
import { useNcoState } from '@/hooks/useNco'

import { Modal } from '@/components/Modal'
import { SlotItem } from '@/components/SlotItem'

import { TitleItemInner } from './TitleItem'
import { SubtitleItem } from './SubtitleItem'

export type TitleDetailHandle = {
  initialize: () => void
}

export type TitleDetailProps = {
  title: ScTitleItem
  isOpen: boolean
  onOpenChange: () => void
  ref: React.Ref<TitleDetailHandle>
}

export const TitleDetail: React.FC<TitleDetailProps> = ({
  title,
  isOpen,
  onOpenChange,
  ref,
}) => {
  const subtitleItemRefs = useRef<{
    [index: number]: SubtitleItemHandle
  }>({})

  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<SyoboCalProgramDb[]>([])
  const [subtitles, setSubtitles] = useState<ScSubtitleItem[]>([])

  const stateSlotDetails = useNcoState('slotDetails')

  const ids = useMemo(() => {
    return stateSlotDetails?.map((v) => v.id)
  }, [stateSlotDetails])

  const programItems = useMemo(() => {
    const currentDate = new Date()

    return programs
      .filter((program) => new Date(program.EdTime) <= currentDate)
      .sort((a, b) => (new Date(a.StTime) > new Date(b.StTime) ? 1 : -1))
      .map((program) => programToSlotDetail(title.Title, program))
  }, [programs])

  const subtitleItems = useMemo(() => {
    const macCountLength = Math.max(...subtitles.map(([cnt]) => cnt.length), 2)

    return subtitles.map((val, idx) => ({
      subtitle: [zeroPadding(val[0], macCountLength), val[1]] as ScSubtitleItem,
      refCallbackFunction: (handle: SubtitleItemHandle | null) => {
        if (handle && !subtitleItemRefs.current[idx]) {
          subtitleItemRefs.current[idx] = handle
        } else {
          delete subtitleItemRefs.current[idx]
        }
      },
    }))
  }, [subtitles])

  const initialize = useCallback(async () => {
    setIsLoading(true)
    setPrograms([])
    setSubtitles([])

    if (title.Cat === '8') {
      const response = await ncoApiProxy.syobocal.db('ProgLookup', {
        TID: title.TID,
        ChID: SYOBOCAL_CHANNEL_IDS,
      })

      if (response) {
        setPrograms(Object.values(response))
      }
    } else {
      const response = await ncoApiProxy.syobocal.json(['SubTitles'], {
        TID: title.TID,
      })

      const subtitles = response?.SubTitles[title.TID]

      if (subtitles) {
        setSubtitles(Object.entries(subtitles))
      }
    }

    setIsLoading(false)
  }, [title.TID, title.Cat])

  useImperativeHandle(ref, () => {
    return { initialize }
  }, [initialize])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      cancelText="閉じる"
      header={<TitleItemInner item={title} isHeader />}
    >
      {isLoading || (!programItems.length && !subtitleItems.length) ? (
        <div
          className={cn(
            'absolute inset-0 z-20',
            'flex size-full items-center justify-center'
          )}
        >
          {isLoading ? (
            <Spinner size="lg" color="primary" />
          ) : (
            <span className="text-small text-foreground-500">
              サブタイトルまたは放送時間がありません
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 p-1.5">
          {programItems.map((detail) => (
            <SlotItem
              key={detail.id}
              detail={detail}
              isSearch
              isDisabled={ids?.includes(detail.id)}
            />
          ))}

          {subtitleItems.map(({ subtitle, refCallbackFunction }, idx) => (
            <SubtitleItem
              key={idx}
              title={title}
              subtitle={subtitle}
              onClick={() => {
                const item = subtitleItemRefs.current[idx]

                if (item.isOpen) {
                  item.close()
                } else {
                  Object.values(subtitleItemRefs.current).forEach((item) => {
                    item.close()
                  })

                  item.open()
                }
              }}
              ref={refCallbackFunction}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}
