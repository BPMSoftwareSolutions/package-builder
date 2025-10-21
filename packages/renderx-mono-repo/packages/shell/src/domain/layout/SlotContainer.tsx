import * as React from "react";
import { PanelSlot } from "../../ui/shared/PanelSlot";

export type SlotCapabilities = {
	droppable?: boolean;
};

export function SlotContainer({
	slot,
	capabilities,
}: {
	slot: string;
	capabilities?: SlotCapabilities;
}) {
	const droppable = !!capabilities?.droppable;
	const onDragOverCapture = React.useCallback(
		(e: React.DragEvent) => {
			if (!droppable) return;
			try {
				e.preventDefault();
				try {
					if ((e as any).dataTransfer)
						(e as any).dataTransfer.dropEffect = "copy";
				} catch {}
			} catch {}
		},
		[droppable]
	);

	// The inner content layer ensures coverage; plugin UI mounts inside
	return (
		<div
			data-slot-content=""
			style={{ position: "absolute", inset: 0, display: "flex" }}
			onDragOverCapture={droppable ? onDragOverCapture : undefined}
		>
			<PanelSlot slot={slot} />
		</div>
	);
}

