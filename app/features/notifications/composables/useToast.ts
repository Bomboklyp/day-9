export function useToast() {
  const toast = useState<{ message: string; id: number } | null>(
    "workflow-toast",
    () => null,
  );
  function notify(message: string) {
    const id = Date.now();
    toast.value = { message, id };
    if (import.meta.client)
      window.setTimeout(() => {
        if (toast.value?.id === id) toast.value = null;
      }, 4500);
  }
  return { toast, notify };
}
