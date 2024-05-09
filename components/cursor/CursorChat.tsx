import CursorSVG from '@/public/assets/CursorSVG'
import { CursorChatProps, CursorMode } from '@/types/type'


const CursorChat = ({ cursor, cursorState, setCursorState, updateMyPresence }: CursorChatProps) => {

  const handelChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    updateMyPresence({ message: e.target.value });
    setCursorState({
      mode: CursorMode.Chat,
      previousMessage: null,
      message: e.target.value
    })
  }

  const handelKeyDown = (e:React.KeyboardEvent<HTMLInputElement>) =>{
    if (e.key === 'Enter') {
      setCursorState({
        mode: CursorMode.Chat,
        previousMessage: cursorState.message,
        message: ''
      })
    }else if (e.key === 'Escape') {
      setCursorState({ mode: CursorMode.Hidden })
    }
  }

  return (
    <div className='absolute top-0 left-0' style={{
      transform: `translateX(${cursor.x}px) translateY(${cursor.y}px)`
    }}>
      {cursorState.mode === CursorMode.Chat && (
        <>
          <CursorSVG color='#0000'/>

          <div className='absolute top-5 left-2 bg-blue-500 px-4 py-2 text-sm leading-relaxed text-white rounded-[20px]'
           onKeyUp={(e) => e.stopPropagation()}
          >
            {cursorState.previousMessage && (
              <div>{cursorState.previousMessage}</div>
            )}
            <input className='z-10 w-60 border-none bg-transparent text-white placeholder-blue-300 outline-none'
            autoFocus={true} 
            onChange={handelChange}
            onKeyDown={handelKeyDown}
            placeholder={cursorState.previousMessage ? '' : 'Type a Message...' }
            value={cursorState.message}
            maxLength={50}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default CursorChat
