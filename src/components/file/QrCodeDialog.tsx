"use client";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QRCodeDialogProps {
  url: string;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ url }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          <QrCode className="h-4 w-4 text-green-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 p-4">
          <QRCodeSVG
            id="qr-code"
            value={url}
            size={250}
            level="H"
            className="w-full h-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;
