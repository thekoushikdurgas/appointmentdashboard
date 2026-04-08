import { graphqlMutation } from "@/lib/graphqlClient";

const CREATE_CAMPAIGN = `
  mutation CampaignCreate($input: CreateCampaignInput!) {
    campaigns {
      createCampaign(input: $input)
    }
  }
`;

const PAUSE_CAMPAIGN = `
  mutation CampaignPause($campaignId: String!) {
    campaigns {
      pauseCampaign(campaignId: $campaignId)
    }
  }
`;

const RESUME_CAMPAIGN = `
  mutation CampaignResume($campaignId: String!) {
    campaigns {
      resumeCampaign(campaignId: $campaignId)
    }
  }
`;

const DELETE_CAMPAIGN = `
  mutation CampaignDelete($campaignId: String!) {
    campaigns {
      deleteCampaign(campaignId: $campaignId)
    }
  }
`;

const CREATE_SEQUENCE = `
  mutation SequenceCreate($input: CreateSequenceInput!) {
    campaigns {
      createSequence(input: $input)
    }
  }
`;

const PAUSE_SEQUENCE = `
  mutation SequencePause($sequenceId: String!) {
    campaigns {
      pauseSequence(sequenceId: $sequenceId)
    }
  }
`;

const RESUME_SEQUENCE = `
  mutation SequenceResume($sequenceId: String!) {
    campaigns {
      resumeSequence(sequenceId: $sequenceId)
    }
  }
`;

const DELETE_SEQUENCE = `
  mutation SequenceDelete($sequenceId: String!) {
    campaigns {
      deleteSequence(sequenceId: $sequenceId)
    }
  }
`;

const ADD_SEQUENCE_STEP = `
  mutation SequenceAddStep($sequenceId: String!, $input: AddSequenceStepInput!) {
    campaigns {
      addSequenceStep(sequenceId: $sequenceId, input: $input)
    }
  }
`;

const UPDATE_SEQUENCE_STEP = `
  mutation SequenceUpdateStep($sequenceId: String!, $stepId: String!, $input: UpdateSequenceStepInput!) {
    campaigns {
      updateSequenceStep(sequenceId: $sequenceId, stepId: $stepId, input: $input)
    }
  }
`;

const DELETE_SEQUENCE_STEP = `
  mutation SequenceDeleteStep($sequenceId: String!, $stepId: String!) {
    campaigns {
      deleteSequenceStep(sequenceId: $sequenceId, stepId: $stepId)
    }
  }
`;

const TRIGGER_SEQUENCE = `
  mutation SequenceTrigger($sequenceId: String!, $input: TriggerSequenceInput!) {
    campaigns {
      triggerSequence(sequenceId: $sequenceId, input: $input)
    }
  }
`;

const CREATE_CAMPAIGN_TEMPLATE = `
  mutation CampaignTemplateCreate($input: CreateCampaignTemplateInput!) {
    campaigns {
      createCampaignTemplate(input: $input)
    }
  }
`;

const UPDATE_CAMPAIGN_TEMPLATE = `
  mutation CampaignTemplateUpdate($templateId: String!, $input: UpdateCampaignTemplateInput!) {
    campaigns {
      updateCampaignTemplate(templateId: $templateId, input: $input)
    }
  }
`;

const DELETE_CAMPAIGN_TEMPLATE = `
  mutation CampaignTemplateDelete($templateId: String!) {
    campaigns {
      deleteCampaignTemplate(templateId: $templateId)
    }
  }
`;

export interface CreateCampaignInput {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  templateId?: string | null;
  audience?: string | null;
  scheduleType?: string | null;
  scheduledAt?: string | null;
}

export interface CreateSequenceInput {
  name: string;
  description?: string | null;
  trigger?: string | null;
}

export interface AddSequenceStepInput {
  stepType: string;
  delayHours?: number | null;
  templateId?: string | null;
  subject?: string | null;
  body?: string | null;
}

export interface UpdateSequenceStepInput {
  stepType?: string | null;
  delayHours?: number | null;
  templateId?: string | null;
  subject?: string | null;
  body?: string | null;
}

export interface TriggerSequenceInput {
  email?: string | null;
  contactId?: string | null;
}

export interface CreateCampaignTemplateInput {
  name: string;
  subject?: string | null;
  body?: string | null;
  category?: string | null;
}

export interface UpdateCampaignTemplateInput {
  name?: string | null;
  subject?: string | null;
  body?: string | null;
  category?: string | null;
}

export const campaignsService = {
  createCampaign: (input: CreateCampaignInput) =>
    graphqlMutation<{ campaigns: { createCampaign: unknown } }>(
      CREATE_CAMPAIGN,
      { input },
    ),

  pauseCampaign: (campaignId: string) =>
    graphqlMutation<{ campaigns: { pauseCampaign: unknown } }>(PAUSE_CAMPAIGN, {
      campaignId,
    }),

  resumeCampaign: (campaignId: string) =>
    graphqlMutation<{ campaigns: { resumeCampaign: unknown } }>(
      RESUME_CAMPAIGN,
      { campaignId },
    ),

  deleteCampaign: (campaignId: string) =>
    graphqlMutation<{ campaigns: { deleteCampaign: boolean } }>(
      DELETE_CAMPAIGN,
      { campaignId },
    ),

  createSequence: (input: CreateSequenceInput) =>
    graphqlMutation<{ campaigns: { createSequence: unknown } }>(
      CREATE_SEQUENCE,
      { input },
    ),

  pauseSequence: (sequenceId: string) =>
    graphqlMutation<{ campaigns: { pauseSequence: unknown } }>(PAUSE_SEQUENCE, {
      sequenceId,
    }),

  resumeSequence: (sequenceId: string) =>
    graphqlMutation<{ campaigns: { resumeSequence: unknown } }>(
      RESUME_SEQUENCE,
      { sequenceId },
    ),

  deleteSequence: (sequenceId: string) =>
    graphqlMutation<{ campaigns: { deleteSequence: boolean } }>(
      DELETE_SEQUENCE,
      { sequenceId },
    ),

  createCampaignTemplate: (input: CreateCampaignTemplateInput) =>
    graphqlMutation<{ campaigns: { createCampaignTemplate: unknown } }>(
      CREATE_CAMPAIGN_TEMPLATE,
      { input },
    ),

  updateCampaignTemplate: (
    templateId: string,
    input: UpdateCampaignTemplateInput,
  ) =>
    graphqlMutation<{ campaigns: { updateCampaignTemplate: unknown } }>(
      UPDATE_CAMPAIGN_TEMPLATE,
      { templateId, input },
    ),

  deleteCampaignTemplate: (templateId: string) =>
    graphqlMutation<{ campaigns: { deleteCampaignTemplate: boolean } }>(
      DELETE_CAMPAIGN_TEMPLATE,
      { templateId },
    ),

  addSequenceStep: (sequenceId: string, input: AddSequenceStepInput) =>
    graphqlMutation<{ campaigns: { addSequenceStep: unknown } }>(
      ADD_SEQUENCE_STEP,
      { sequenceId, input },
    ),

  updateSequenceStep: (
    sequenceId: string,
    stepId: string,
    input: UpdateSequenceStepInput,
  ) =>
    graphqlMutation<{ campaigns: { updateSequenceStep: unknown } }>(
      UPDATE_SEQUENCE_STEP,
      { sequenceId, stepId, input },
    ),

  deleteSequenceStep: (sequenceId: string, stepId: string) =>
    graphqlMutation<{ campaigns: { deleteSequenceStep: boolean } }>(
      DELETE_SEQUENCE_STEP,
      { sequenceId, stepId },
    ),

  triggerSequence: (sequenceId: string, input: TriggerSequenceInput) =>
    graphqlMutation<{ campaigns: { triggerSequence: unknown } }>(
      TRIGGER_SEQUENCE,
      { sequenceId, input },
    ),
};
