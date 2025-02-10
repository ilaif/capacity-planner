import { Input } from '@/components/ui/input';
import { ParseResult } from 'papaparse';
import Papa from 'papaparse';
import { Feature, FeatureCSV } from '@/types/capacity-planner';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';
import { PROJECT_COLORS } from '@/lib/colors';

type FeatureUploadProps = {
  onFeaturesUploaded: (features: Feature[]) => void;
  teamNames: string[];
};

export function FeatureUpload({ onFeaturesUploaded, teamNames }: FeatureUploadProps) {
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  const projects = usePlannerStore(state => state.planState.projects);
  const addProject = usePlannerStore(state => state.addProject);

  const findCaseInsensitiveKey = (
    obj: Record<string, string>,
    searchKey: string
  ): string | undefined => {
    const lowerSearchKey = searchKey.toLowerCase();
    return Object.keys(obj).find(key => key.toLowerCase() === lowerSearchKey);
  };

  const getOrCreateProject = (projectName: string): number | null => {
    if (!projectName) return null;

    const existingProject = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    if (existingProject) return existingProject.id;

    // Create new project with a random color from presets
    const randomColor = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)].value;
    const newProject = {
      name: projectName,
      description: '',
      color: randomColor,
    };
    addProject(newProject);

    // Find the newly created project to get its ID
    const createdProject = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    return createdProject?.id ?? null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<FeatureCSV>) => {
          const newFeatures = results.data.map((row, index) => {
            const requirements: { [key: string]: { weeks: number; parallel: number } } = {};
            teamNames.forEach(teamName => {
              const weeksKey = findCaseInsensitiveKey(row, `${teamName}_weeks`);
              const parallelKey = findCaseInsensitiveKey(row, `${teamName}_parallel`);

              requirements[teamName] = {
                weeks: parseInt(weeksKey ? row[weeksKey] : '0') || 0,
                parallel: parseInt(parallelKey ? row[parallelKey] : '1') || 1,
              };
            });

            const featureKey = findCaseInsensitiveKey(row, 'feature');
            const descriptionKey = findCaseInsensitiveKey(row, 'description');
            const projectKey = findCaseInsensitiveKey(row, 'project');
            const projectName = projectKey ? row[projectKey] : '';

            return {
              id: index + 1,
              name: featureKey ? row[featureKey] : `Feature ${index + 1}`,
              requirements,
              description: descriptionKey ? row[descriptionKey] : '',
              projectId: getOrCreateProject(projectName),
            };
          });
          onFeaturesUploaded(newFeatures);
        },
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-sm font-medium whitespace-nowrap">Upload CSV</h3>
        <Input type="file" accept=".csv" onChange={handleFileUpload} />
        <button
          onClick={() => setIsRequirementsOpen(!isRequirementsOpen)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2 whitespace-nowrap"
        >
          {isRequirementsOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          CSV Format Requirements
        </button>
      </div>
      {isRequirementsOpen && (
        <div className="space-y-2 text-sm text-gray-500 pl-6">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="text-left pr-4">Column</th>
                <th className="text-left pr-4">Type</th>
                <th className="text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-4">feature</td>
                <td className="pr-4">text</td>
                <td>Feature name (e.g., "Login System") - Case insensitive</td>
              </tr>
              <tr>
                <td className="pr-4">project</td>
                <td className="pr-4">text</td>
                <td>Project name (e.g., "Phase 1") - Case insensitive</td>
              </tr>
              <tr>
                <td className="pr-4">description</td>
                <td className="pr-4">text</td>
                <td>Feature description (optional) - Case insensitive</td>
              </tr>
              {teamNames.map(teamName => (
                <>
                  <tr key={`${teamName}_weeks`}>
                    <td className="pr-4">{teamName}_weeks</td>
                    <td className="pr-4">number</td>
                    <td>
                      Number of engineer weeks needed by {teamName} team (e.g., 3) - Case
                      insensitive
                    </td>
                  </tr>
                  <tr key={`${teamName}_parallel`}>
                    <td className="pr-4">{teamName}_parallel</td>
                    <td className="pr-4">number</td>
                    <td>
                      Number of {teamName} engineers that can work in parallel (e.g., 2) - Case
                      insensitive
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
          <p className="mt-2">Example row:</p>
          <code className="block bg-gray-100 p-2 rounded dark:bg-gray-800">
            {`Feature Name,Project,${teamNames.map(teamName => `${teamName}_weeks,${teamName}_parallel`).join(',')}`}
            <br />
            {`Login System,Phase 1,${teamNames.map(() => '3,2').join(',')}`}
          </code>
          <p className="mt-2 text-xs text-gray-500">Note: Column names are case-insensitive</p>
        </div>
      )}
    </div>
  );
}
