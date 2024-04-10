import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { SHORT_CODE_LENGTH } from "@/config";
import { getRoomIdByShortCode } from "@/services/room";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinRoomSection(){

  const router = useRouter();

  const [shortCode, setShortCode] = useState<string>("");

  async function joinRoom(){
    if(shortCode.length < SHORT_CODE_LENGTH){
      toast({
        title: "Invalid room code",
        description: "Room code must be 4 characters long",
        variant: "destructive"
      })
      return;
    } 
    
    const roomId = await getRoomIdByShortCode(shortCode);

    if(!roomId){
      toast({
        title: "Room not found",
        description: `Room with code ${shortCode} couldn't be found`,
        variant: "destructive"  
      })
      return;
    }
      
    router.push(`game?roomId=${roomId}`);

  }

  return (
    <div 
      className="bg-gray-700 rounded-lg shadow-md p-2 flex flex-col"
      >
      <form 
        className="bg-gray-700 rounded-lg p-4 flex flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          joinRoom();
        }}
      >
        <div className="flex flex-col gap-4">
          <Label>Room code</Label>
          <Input
            id="roomName"
            required
            name="roomName"
            placeholder="Enter room code"
            type="text"
            value={shortCode}
            onChange={(e) => {
              let input = e.target.value;
              setShortCode(input.substring(0, SHORT_CODE_LENGTH).toUpperCase());
            }}
          />
        </div>
        <Button type="submit">Join Room</Button>
      </form>
      </div>
  )

}