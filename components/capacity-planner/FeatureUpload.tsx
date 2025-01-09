import { Input } from '@/components/ui/input';
import { ParseResult } from 'papaparse';
import Papa from 'papaparse';
import { Feature, FeatureCSV } from '@/types/capacity-planner';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FeatureUploadProps {
  onFeaturesUploaded: (features: Feature[]) => void;
  teams: string[];
}

export function FeatureUpload({ onFeaturesUploaded, teams }: FeatureUploadProps) {
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);

  const findCaseInsensitiveKey = (
    obj: Record<string, string>,
    searchKey: string
  ): string | undefined => {
    const lowerSearchKey = searchKey.toLowerCase();
    return Object.keys(obj).find(key => key.toLowerCase() === lowerSearchKey);
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
            teams.forEach(team => {
              const weeksKey = findCaseInsensitiveKey(row, `${team}_weeks`);
              const parallelKey = findCaseInsensitiveKey(row, `${team}_parallel`);

              requirements[team] = {
                weeks: parseInt(weeksKey ? row[weeksKey] : '0') || 0,
                parallel: parseInt(parallelKey ? row[parallelKey] : '1') || 1,
              };
            });

            const featureKey = findCaseInsensitiveKey(row, 'feature');
            return {
              id: index + 1,
              name: featureKey ? row[featureKey] : `Feature ${index + 1}`,
              requirements,
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
              {teams.map(team => (
                <>
                  <tr key={`${team}_weeks`}>
                    <td className="pr-4">{team}_weeks</td>
                    <td className="pr-4">number</td>
                    <td>Number of weeks needed by {team} team (e.g., 3) - Case insensitive</td>
                  </tr>
                  <tr key={`${team}_parallel`}>
                    <td className="pr-4">{team}_parallel</td>
                    <td className="pr-4">number</td>
                    <td>
                      Number of {team} engineers that can work in parallel (e.g., 2) - Case
                      insensitive
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
          <p className="mt-2">Example row:</p>
          <code className="block bg-gray-100 p-2 rounded">
            {`Feature Name,${teams.map(team => `${team}_weeks,${team}_parallel`).join(',')}`}
            <br />
            {`Login System,${teams.map(() => '3,2').join(',')}`}
          </code>
          <p className="mt-2 text-xs text-gray-500">Note: Column names are case-insensitive</p>
        </div>
      )}
    </div>
  );
}
