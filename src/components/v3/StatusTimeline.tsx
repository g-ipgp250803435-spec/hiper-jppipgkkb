type Props={status:string}
const steps=['submitted','reviewing','approved','payment_processing','completed']
export default function StatusTimeline({status}:Props){
 const current=Math.max(steps.indexOf(status),0)
 return <div className="status-timeline">{steps.map((s,i)=><div key={s}>{i<=current?'✓':'○'} {s.replace('_',' ')}</div>)}</div>
}
