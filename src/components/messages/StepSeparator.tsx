interface StepSeparatorProps {
  isFirstStep: boolean;
}

export default function StepSeparator({ isFirstStep }: StepSeparatorProps) {
  if (isFirstStep) {
    return null;
  }

  return (
    <div className="text-gray-500">
      <hr className="my-2 border-gray-300" />
    </div>
  );
}
