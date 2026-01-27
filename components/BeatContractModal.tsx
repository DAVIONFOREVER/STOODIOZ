
import React, { useCallback, useEffect } from 'react';
import { CloseIcon } from './icons';
import type { Instrumental, Producer } from '../types';

type ContractType = 'lease' | 'exclusive';

interface BeatContractModalProps {
    type: ContractType;
    onClose: () => void;
    instrumental?: Instrumental | null;
    producer?: Producer | null;
}

const LEASE_AGREEMENT = (beat: string, producerName: string) => `
BEAT LEASE AGREEMENT

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. PARTIES
   This Beat Lease Agreement ("Agreement") is between the Producer ("Licensor") and the Buyer ("Licensee"). 
   Beat: "${beat}". Producer: ${producerName}.

2. GRANT OF RIGHTS (NON-EXCLUSIVE LEASE)
   Subject to full payment, Licensor grants Licensee a non-exclusive, non-transferable license to use the 
   instrumental composition in the following manner:
   - Use in one (1) commercial sound recording (single, EP, or album track).
   - Distribution limit: up to 50,000 (fifty thousand) paid streams or 5,000 (five thousand) physical/digital 
     units sold, whichever comes first.
   - Format: MP3 (or as delivered). No stems or project files.

3. RESTRICTIONS
   Licensee shall NOT: (a) sell, lease, or sublicense the Beat to any third party; (b) claim authorship 
   or ownership of the Beat; (c) use the Beat in a manner that is illegal or infringing; (d) exceed the 
   stream or unit limits without upgrading to a new lease or exclusive license.

4. CREDIT
   Licensee shall credit the Producer in the form: "Produced by [Producer Name]" in metadata and, where 
   practical, in liner notes or description.

5. NO OWNERSHIP
   Licensor retains all ownership and copyright in the Beat. This Agreement grants a limited license only.

6. TERM & TERMINATION
   The license is valid in perpetuity for the uses and limits described. Licensor may terminate if Licensee 
   breaches this Agreement.

7. DISCLAIMER
   THE BEAT IS PROVIDED "AS IS." LICENSOR DISCLAIMS ALL WARRANTIES. IN NO EVENT SHALL LICENSOR BE LIABLE 
   FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.

By purchasing and using the Beat, Licensee agrees to these terms.
`;

const EXCLUSIVE_AGREEMENT = (beat: string, producerName: string) => `
EXCLUSIVE RIGHTS AGREEMENT

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. PARTIES
   This Exclusive Rights Agreement ("Agreement") is between the Producer ("Licensor") and the Buyer ("Licensee"). 
   Beat: "${beat}". Producer: ${producerName}.

2. GRANT OF EXCLUSIVE RIGHTS
   Subject to full payment, Licensor grants Licensee the EXCLUSIVE right to use the instrumental composition 
   in all manners, including but not limited to:
   - Unlimited commercial sound recordings (singles, EPs, albums, compilations).
   - Unlimited streams, physical and digital sales.
   - Delivery of high-quality WAV and, if agreed, stems or project files (as specified at purchase).
   - Use in film, TV, advertising, and other media (for the composition only; sample clearance is Licensee's 
     responsibility if the Beat contains third-party samples).

3. TRANSFER OF RIGHTS
   Upon full payment, the exclusive commercial and exploitative rights to the Beat are transferred to Licensee 
   for the full term of copyright. Licensor retains the right to be identified as the original producer and 
   to receive credit.

4. CREDIT
   Licensee shall credit the Producer as "Produced by [Producer Name]" in all commercial uses, metadata, 
   and where practical in liner notes or description.

5. REPRESENTATIONS
   Licensor represents that they have the right to grant these rights. Licensee is responsible for obtaining 
   any necessary sample clearances if the Beat contains third-party material.

6. INDEMNITY
   Each party shall indemnify the other for claims arising from their breach of this Agreement or 
   misrepresentation.

7. DISCLAIMER
   EXCEPT AS EXPRESSLY STATED, THE BEAT IS PROVIDED "AS IS." LICENSOR DISCLAIMS IMPLIED WARRANTIES. 
   LIABILITY IS LIMITED TO THE AMOUNT PAID FOR THE BEAT.

By purchasing under the Exclusive option, Licensee agrees to these terms.
`;

function getContractHtml(type: ContractType, beat: string, producerName: string): string {
    const title = type === 'lease' ? 'Beat Lease Agreement' : 'Exclusive Rights Agreement';
    const body = type === 'lease' ? LEASE_AGREEMENT(beat, producerName) : EXCLUSIVE_AGREEMENT(beat, producerName);
    const text = body.replace(/\n/g, '<br>');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 680px; margin: 2rem auto; padding: 1rem; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    pre { white-space: pre-wrap; font-family: inherit; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre>${body}</pre>
</body>
</html>`;
}

const BeatContractModal: React.FC<BeatContractModalProps> = ({ type, onClose, instrumental, producer }) => {
    const beat = instrumental?.title || 'The Beat';
    const producerName = producer?.name || 'The Producer';

    const handleDownload = useCallback(() => {
        const html = getContractHtml(type, beat, producerName);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = type === 'lease' ? 'Beat-Lease-Agreement.html' : 'Beat-Exclusive-Agreement.html';
        a.click();
        URL.revokeObjectURL(url);
    }, [type, beat, producerName]);

    const isLease = type === 'lease';
    const body = isLease ? LEASE_AGREEMENT(beat, producerName) : EXCLUSIVE_AGREEMENT(beat, producerName);
    const title = isLease ? 'Lease Agreement' : 'Exclusive Rights Agreement';

    const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Only close if clicking the backdrop itself, not the modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Close on ESC key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="contract-title"
            onClick={handleBackdropClick}
        >
            <div 
                className="w-full max-w-2xl max-h-[90vh] flex flex-col cardSurface"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-zinc-700/50 flex justify-between items-center flex-shrink-0">
                    <h2 id="contract-title" className="text-xl font-bold text-zinc-100">{title}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
                        >
                            Download
                        </button>
                        <button 
                            onClick={onClose} 
                            className="text-zinc-400 hover:text-zinc-200 p-1 transition-colors"
                            aria-label="Close contract modal"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300 leading-relaxed">
                        {body}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default BeatContractModal;
