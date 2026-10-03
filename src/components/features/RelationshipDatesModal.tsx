import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { friendlyError } from '@/lib/errors'
import { today } from '@/lib/utils'

export function RelationshipDatesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { couple, updateCoupleFields } = useCouple()
  const toast = useToast()
  const [v, setV] = useState({ relationshipStart: '', firstMeeting: '', firstDate: '', anniversary: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setV({
      relationshipStart: couple?.relationshipStart ?? '', firstMeeting: couple?.firstMeeting ?? '',
      firstDate: couple?.firstDate ?? '', anniversary: couple?.anniversary ?? '',
    })
  }, [open, couple])

  const save = async () => {
    setBusy(true)
    try {
      await updateCoupleFields({
        relationshipStart: v.relationshipStart || undefined, firstMeeting: v.firstMeeting || undefined,
        firstDate: v.firstDate || undefined, anniversary: v.anniversary || v.relationshipStart || undefined,
      })
      toast.show('Your dates are saved ❤️', 'love'); onClose()
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }
  const f = (k: keyof typeof v) => ({ value: v[k], max: today(), onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }) })
  return (
    <Modal open={open} onClose={onClose} title="Your important dates" description="These power your together counter and milestones.">
      <div className="space-y-4">
        <Input label="Relationship start date" type="date" {...f('relationshipStart')} hint="The day you became “us”." />
        <Input label="First meeting" type="date" optional {...f('firstMeeting')} />
        <Input label="First date" type="date" optional {...f('firstDate')} />
        <Input label="Anniversary" type="date" optional {...f('anniversary')} hint="Defaults to your relationship start date." />
        <Button size="lg" className="w-full" onClick={save} loading={busy}>Save dates</Button>
      </div>
    </Modal>
  )
}
