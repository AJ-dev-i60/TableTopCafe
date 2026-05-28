<template>
  <div>
    <!-- Existing photos -->
    <div v-if="existingPhotos.length > 0" class="flex flex-wrap gap-3 mb-4">
      <div
        v-for="hash in existingPhotos"
        :key="hash"
        class="relative w-20 h-20 rounded-[--radius-md] overflow-hidden border border-[--color-border]"
      >
        <img
          :src="`/api/photos/${hash}/thumb.webp`"
          :alt="hash"
          class="w-full h-full object-cover"
        />
      </div>
    </div>

    <!-- File input -->
    <label
      class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[--color-border] rounded-[--radius-lg] cursor-pointer hover:border-[--color-brand] transition-colors bg-white"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <span class="text-sm text-[--color-text-muted]">
        {{ pending ? 'Uploading…' : 'Click or drag photos here' }}
      </span>
      <span class="text-xs text-[--color-text-muted] mt-1">JPEG, PNG, WebP</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        class="hidden"
        @change="onFileChange"
      />
    </label>

    <!-- Preview of newly selected files -->
    <div v-if="previews.length > 0" class="flex flex-wrap gap-3 mt-3">
      <div
        v-for="(src, i) in previews"
        :key="i"
        class="relative w-20 h-20 rounded-[--radius-md] overflow-hidden border border-[--color-border]"
      >
        <img :src="src" class="w-full h-full object-cover" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  gameId: number
  existingPhotos?: string[]
}>()

const emit = defineEmits<{
  uploaded: [hashes: string[]]
}>()

const previews = ref<string[]>([])
const pending = ref(false)
let pendingFiles: File[] = []

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
}

function onDrop(e: DragEvent) {
  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'))
  addFiles(files)
}

function addFiles(files: File[]) {
  pendingFiles = [...pendingFiles, ...files]
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') previews.value.push(e.target.result)
    }
    reader.readAsDataURL(file)
  }
}

// Called by parent after game is saved
async function upload(): Promise<void> {
  if (pendingFiles.length === 0) return
  pending.value = true
  try {
    const fd = new FormData()
    for (const file of pendingFiles) fd.append('photos', file)
    const result = await $fetch<{ hashes: string[] }>(`/api/staff/games/${props.gameId}/photos`, {
      method: 'POST',
      body: fd,
    })
    emit('uploaded', result.hashes)
    pendingFiles = []
    previews.value = []
  } finally {
    pending.value = false
  }
}

defineExpose({ upload })
</script>
