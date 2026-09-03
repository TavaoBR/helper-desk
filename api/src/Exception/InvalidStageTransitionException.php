<?php

namespace App\Exception;

class InvalidStageTransitionException extends DomainException
{
    public function __construct(string $fromStage, string $toStage, array $details = [])
    {
        parent::__construct(
            sprintf('A transição da etapa "%s" para "%s" não é permitida pelas regras do pipeline.', $fromStage, $toStage),
            'TICKET_STAGE_TRANSITION_NOT_ALLOWED',
            422,
            $details
        );
    }
}
