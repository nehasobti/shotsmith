import { ref, onUnmounted } from 'vue';
import type { JobType } from '@shopshot/shared';

export interface ActiveJob {
  id: string;
  type: JobType;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  startedAt: number;
}

export function useJobs() {
  const activeJob = ref<ActiveJob | null>(null);
  const isJobRunning = ref(false);
  const elapsedSeconds = ref(0);
  const jobError = ref<string | null>(null);

  let pollTimer: any = null;
  let elapsedTimer: any = null;

  const startJob = async (payload: {
    projectId: string;
    sourceAssetId: string;
    type: JobType;
    params?: Record<string, any>;
  }): Promise<{ job: any; remainingCredits: number }> => {
    jobError.value = null;
    isJobRunning.value = true;
    elapsedSeconds.value = 0;

    const res = await $fetch<{ job: any; remainingCredits: number }>('/api/jobs', {
      method: 'POST',
      body: {
        projectId: payload.projectId,
        sourceAssetId: payload.sourceAssetId,
        type: payload.type,
        params: payload.params || {},
      },
    });

    activeJob.value = {
      id: res.job.id,
      type: payload.type,
      status: 'queued',
      startedAt: Date.now(),
    };

    // Start elapsed timer
    elapsedTimer = setInterval(() => {
      elapsedSeconds.value += 1;
    }, 1000);

    return res;
  };

  const pollJobUntilDone = (
    jobId: string,
    callbacks: {
      onSuccess: (resultAssets: any[]) => void;
      onError: (errorMsg: string) => void;
    }
  ) => {
    clearInterval(pollTimer);

    pollTimer = setInterval(async () => {
      try {
        const res = await $fetch<{ job: any; resultAssets: any[] }>(`/api/jobs/${jobId}`);
        const status = res.job.status;

        if (activeJob.value) {
          activeJob.value.status = status;
        }

        if (status === 'succeeded') {
          stopTimers();
          isJobRunning.value = false;
          callbacks.onSuccess(res.resultAssets);
        } else if (status === 'failed') {
          stopTimers();
          isJobRunning.value = false;
          const msg = res.job.error || 'Generation failed. Credits have been refunded.';
          jobError.value = msg;
          callbacks.onError(msg);
        }
      } catch (err: any) {
        console.error('Error polling job status:', err);
      }
    }, 2000);
  };

  const stopTimers = () => {
    if (pollTimer) clearInterval(pollTimer);
    if (elapsedTimer) clearInterval(elapsedTimer);
    pollTimer = null;
    elapsedTimer = null;
  };

  onUnmounted(() => {
    stopTimers();
  });

  return {
    activeJob,
    isJobRunning,
    elapsedSeconds,
    jobError,
    startJob,
    pollJobUntilDone,
    stopTimers,
  };
}
