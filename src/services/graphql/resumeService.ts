import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";

export interface ResumeRecord {
  id: string;
  userId: string;
  resumeData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const LIST = `query ResumesGateway {
  resume {
    resumes {
      id
      userId
      resumeData
      createdAt
      updatedAt
    }
  }
}`;

const ONE = `query ResumeOne($id: ID!) {
  resume {
    resume(id: $id) {
      id
      userId
      resumeData
      createdAt
      updatedAt
    }
  }
}`;

const DELETE = `mutation ResumeDelete($id: ID!) {
  resume {
    deleteResume(id: $id)
  }
}`;

const SAVE = `mutation SaveResume($input: SaveResumeInput!) {
  resume {
    saveResume(input: $input) {
      id
      userId
      resumeData
      createdAt
      updatedAt
    }
  }
}`;

export const resumeService = {
  list: () => graphqlQuery<{ resume: { resumes: ResumeRecord[] } }>(LIST),

  get: (id: string) =>
    graphqlQuery<{ resume: { resume: ResumeRecord } }>(ONE, { id }),

  save: (input: { resumeData: Record<string, unknown>; id?: string | null }) =>
    graphqlMutation<{ resume: { saveResume: ResumeRecord } }>(SAVE, { input }),

  delete: (id: string) =>
    graphqlMutation<{ resume: { deleteResume: boolean } }>(DELETE, { id }),
};
